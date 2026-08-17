const dailyClosingRepository = require('../repositories/dailyClosing.repository');
const InventoryTransaction = require('../models/inventoryTransaction.model');
const MealDistribution = require('../models/mealDistribution.model');
const Reservation = require('../models/reservation.model');
const AppError = require('../utils/appError');

class DailyClosingService {
  /**
   * Helper: Get start and end of a logical date
   */
  _getDateRange(logicalDate) {
    const start = new Date(logicalDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Central Freeze Mechanism
   * Used by other services to check if they can write for a specific date
   */
  async assertOperationalDayWritable(warehouseId, date) {
    if (!warehouseId || !date) return;
    const { start } = this._getDateRange(date);
    const closing = await dailyClosingRepository.findByLogicalDateAndWarehouse(start, warehouseId);
    if (closing && ['RECONCILING', 'PENDING_APPROVAL', 'CLOSED'].includes(closing.status)) {
      throw new AppError(`Operational day is frozen and cannot be modified. Date ${start.toISOString().split('T')[0]} is locked.`, 403);
    }
  }

  /**
   * Open a new operational day
   */
  async openDay(warehouseId, logicalDateString, userId) {
    const { start } = this._getDateRange(logicalDateString);
    
    // Check if already exists
    const existing = await dailyClosingRepository.findByLogicalDateAndWarehouse(start, warehouseId);
    if (existing) {
      throw new AppError('An operational day for this date and warehouse already exists.', 400);
    }

    let openingStockSnapshot = [];
    
    // Calculate D-1
    const previousDayStart = new Date(start);
    previousDayStart.setUTCDate(previousDayStart.getUTCDate() - 1);
    
    // Find if ANY daily closing exists for this warehouse
    const DailyClosing = require('../models/dailyClosing.model');
    const totalClosings = await DailyClosing.countDocuments({ warehouse: warehouseId });
    
    if (totalClosings === 0) {
      // First day of the system
      const Batch = require('../models/batch.model');
      const batches = await Batch.find({ 
        warehouse: warehouseId, 
        status: { $in: ['active', 'expired', 'quarantined'] } 
      }).populate('product');
      
      openingStockSnapshot = batches.map(b => ({
        product: b.product._id,
        batch: b._id,
        unit: b.product.unit, // Base unit from product
        quantity: b.availableQuantity + b.reservedQuantity, // Total physical quantity
        unitCost: b.unitCost || 0,
        totalValue: (b.availableQuantity + b.reservedQuantity) * (b.unitCost || 0),
      }));
    } else {
      // Not first day. D-1 must exist and be CLOSED.
      const previousDayClosing = await dailyClosingRepository.findByLogicalDateAndWarehouse(previousDayStart, warehouseId);
      
      if (!previousDayClosing) {
        throw new AppError(`Cannot open day ${start.toISOString().split('T')[0]}. The previous day (${previousDayStart.toISOString().split('T')[0]}) is missing. You must open and close days sequentially.`, 400);
      }
      
      if (previousDayClosing.status !== 'CLOSED') {
        throw new AppError(`Cannot open day ${start.toISOString().split('T')[0]}. The previous day (${previousDayStart.toISOString().split('T')[0]}) is currently ${previousDayClosing.status}. It must be CLOSED first.`, 400);
      }
      
      openingStockSnapshot = previousDayClosing.closingStockSnapshot;
    }

    const newDay = await dailyClosingRepository.create({
      logicalDate: start,
      warehouse: warehouseId,
      status: 'OPEN',
      openedBy: userId,
      openingStockSnapshot,
    });

    return newDay;
  }

  /**
   * Start reconciliation
   */
  async startReconciliation(id, userId) {
    const closing = await dailyClosingRepository.findById(id);
    if (!closing) throw new AppError('Daily Closing not found', 404);
    if (closing.status !== 'OPEN') {
      throw new AppError(`Cannot start reconciliation from status ${closing.status}`, 400);
    }

    const { start, end } = this._getDateRange(closing.logicalDate);

    // 1. Checklist Validations
    const pendingDistributions = await MealDistribution.countDocuments({
      status: { $in: ['draft', 'in_progress'] },
      distributionDate: { $gte: start, $lte: end },
      // Assuming warehouse is derived from reservation, skipped for simplicity or must add warehouse to mealDistribution
    });
    if (pendingDistributions > 0) {
      throw new AppError('Checklist failed: There are pending or draft meal distributions for this date.', 400);
    }

    const completedDistributions = await MealDistribution.find({
      status: 'completed',
      distributionDate: { $gte: start, $lte: end },
    });
    for (const dist of completedDistributions) {
      if (dist.actualServings === undefined || dist.actualServings === null) {
        throw new AppError(`Checklist failed: Meal distribution ${dist.distributionNumber || dist._id} is completed without actual servings.`, 400);
      }
      if (dist.actualServings < 0) {
        throw new AppError(`Checklist failed: Meal distribution ${dist.distributionNumber || dist._id} has invalid actual servings (${dist.actualServings}).`, 400);
      }
      if (dist.plannedServings !== undefined && dist.actualServings > dist.plannedServings) {
        throw new AppError(`Checklist failed: Meal distribution ${dist.distributionNumber || dist._id} actual servings exceed planned servings.`, 400);
      }
    }

    const pendingReservations = await Reservation.countDocuments({
      warehouse: closing.warehouse._id,
      status: { $in: ['draft', 'reserved'] },
      operationalDate: { $gte: start, $lte: end }, // Match logical operational day
    });
    if (pendingReservations > 0) {
      throw new AppError('Checklist failed: There are unresolved reservations for this date.', 400);
    }

    // 2. Inventory Reconciliation
    const transactions = await InventoryTransaction.find({
      warehouse: closing.warehouse._id,
      transactionDate: { $gte: start, $lte: end },
    });

    const invSummary = {
      totalReceiving: 0,
      totalIssue: 0,
      totalWaste: 0,
      totalReturn: 0,
      totalAdjustment: 0,
      totalTransferIn: 0,
      totalTransferOut: 0,
    };

    const expectedStockMap = new Map();

    // 1. Load Opening Stock
    closing.openingStockSnapshot.forEach(snap => {
      expectedStockMap.set(snap.batch.toString(), {
        product: snap.product,
        unit: snap.unit,
        quantity: snap.quantity,
        unitCost: snap.unitCost,
      });
    });

    transactions.forEach(tx => {
      const batchId = tx.batch.toString();
      if (!expectedStockMap.has(batchId)) {
        expectedStockMap.set(batchId, {
          product: tx.product,
          unit: null, 
          quantity: 0,
          unitCost: tx.unitCost,
        });
      }
      const bStock = expectedStockMap.get(batchId);

      switch (tx.transactionType) {
        case 'receiving': 
          invSummary.totalReceiving += tx.quantity; 
          bStock.quantity += tx.quantity;
          break;
        case 'issue': 
          invSummary.totalIssue += tx.quantity; 
          bStock.quantity -= tx.quantity;
          break;
        case 'waste': 
          invSummary.totalWaste += tx.quantity; 
          bStock.quantity -= tx.quantity;
          break;
        case 'return': 
          invSummary.totalReturn += tx.quantity; 
          bStock.quantity += tx.quantity;
          break;
        case 'adjustment': 
          invSummary.totalAdjustment += Math.abs(tx.quantity); 
          bStock.quantity += tx.quantity; 
          break;
        case 'transfer_in': 
          invSummary.totalTransferIn += tx.quantity; 
          bStock.quantity += tx.quantity;
          break;
        case 'transfer_out': 
          invSummary.totalTransferOut += tx.quantity; 
          bStock.quantity -= tx.quantity;
          break;
        case 'return_to_supplier':
          bStock.quantity -= tx.quantity;
          break;
        case 'cancellation':
          bStock.quantity += tx.quantity;
          break;
      }
    });

    // Take Closing Stock Snapshot & Verify
    const Batch = require('../models/batch.model');
    const batches = await Batch.find({ 
      warehouse: closing.warehouse._id,
      status: { $in: ['active', 'expired', 'quarantined', 'depleted'] } 
    }).populate('product');
    
    const closingStockSnapshot = [];
    const discrepancies = [];

    batches.forEach(b => {
      const batchId = b._id.toString();
      const physicalQty = b.availableQuantity + b.reservedQuantity;
      const expectedQty = expectedStockMap.has(batchId) ? expectedStockMap.get(batchId).quantity : 0;
      
      if (Math.abs(physicalQty - expectedQty) > 0.001) {
        discrepancies.push({
          batch: batchId,
          product: b.product.name,
          expected: expectedQty,
          actual: physicalQty,
          difference: physicalQty - expectedQty
        });
      }

      closingStockSnapshot.push({
        product: b.product._id,
        batch: b._id,
        unit: b.product.unit, // Base unit from product
        quantity: expectedQty, // Saving expected qty as the verified snapshot
        unitCost: b.unitCost || 0,
        totalValue: expectedQty * (b.unitCost || 0),
      });
      
      expectedStockMap.delete(batchId);
    });

    expectedStockMap.forEach((data, batchId) => {
      if (Math.abs(data.quantity) > 0.001) {
        discrepancies.push({
          batch: batchId,
          product: data.product,
          expected: data.quantity,
          actual: 0,
          difference: -data.quantity
        });
      }
    });

    if (discrepancies.length > 0) {
      throw new AppError(`Checklist failed: Stock reconciliation found discrepancies in ${discrepancies.length} batches. Expected closing stock does not match current physical stock.`, 400);
    }

    // 3. Meal Reconciliation
    const distributions = await MealDistribution.find({
      status: 'completed',
      completedAt: { $gte: start, $lte: end },
    });

    const mealSummary = {
      plannedMeals: 0,
      actualMeals: 0,
      executionRate: 0,
    };
    const costSummary = {
      totalStandardCost: 0,
      totalActualCost: 0,
      totalWasteCost: 0,
      operationalCost: 0,
      varianceAmount: 0,
    };

    distributions.forEach(dist => {
      mealSummary.plannedMeals += dist.plannedServings || 0;
      mealSummary.actualMeals += dist.actualServings || 0;

      costSummary.totalStandardCost += dist.totalStandardCost || 0;
      costSummary.totalActualCost += dist.totalActualCost || 0;
      costSummary.totalWasteCost += dist.totalWasteCost || 0;
      costSummary.operationalCost += dist.operationalCost || 0;
      costSummary.varianceAmount += dist.varianceAmount || 0;
    });

    if (mealSummary.plannedMeals > 0) {
      mealSummary.executionRate = (mealSummary.actualMeals / mealSummary.plannedMeals) * 100;
    }

    closing.status = 'RECONCILING';
    closing.reconciledAt = new Date();
    closing.reconciledBy = userId;
    closing.inventorySummary = invSummary;
    closing.mealSummary = mealSummary;
    closing.costSummary = costSummary;
    closing.closingStockSnapshot = closingStockSnapshot;

    await closing.save();
    return closing;
  }

  /**
   * Submit for approval
   */
  async submitForApproval(id, userId, notes) {
    const closing = await dailyClosingRepository.findById(id);
    if (!closing) throw new AppError('Daily Closing not found', 404);
    if (closing.status !== 'RECONCILING') {
      throw new AppError(`Cannot submit from status ${closing.status}`, 400);
    }

    closing.status = 'PENDING_APPROVAL';
    closing.submittedAt = new Date();
    closing.submittedBy = userId;
    if (notes) closing.notes = notes;

    await closing.save();
    return closing;
  }

  /**
   * Approve and Close
   */
  async approveAndClose(id, userId, notes) {
    const closing = await dailyClosingRepository.findById(id);
    if (!closing) throw new AppError('Daily Closing not found', 404);
    if (closing.status !== 'PENDING_APPROVAL') {
      throw new AppError(`Cannot approve from status ${closing.status}`, 400);
    }

    closing.status = 'CLOSED';
    closing.closedAt = new Date();
    closing.closedBy = userId;
    closing.approvedBy = userId;
    if (notes) closing.notes = notes;

    await closing.save();
    return closing;
  }
}

module.exports = new DailyClosingService();
