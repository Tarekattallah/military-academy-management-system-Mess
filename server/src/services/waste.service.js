const mongoose = require('mongoose');
const wasteRepository = require('../repositories/waste.repository');
const batchRepository = require('../repositories/batch.repository');
const inventoryTransactionService = require('./inventoryTransaction.service');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const Waste = require('../models/waste.model');
const AppError = require('../utils/AppError');

const wasteService = {
  /**
   * Creates a Waste document and processes all items atomically.
   *
   * Workflow:
   *   1. Validates warehouse (exists, active)
   *   2. Validates products (exist, active)
   *   3. Validates batches (exist, belong to warehouse + product, active)
   *   4. Validates quantities (positive, within available)
   *   5. Validates waste reason is provided
   *   6. Starts MongoDB transaction
   *   7. Creates Waste document
   *   8. For each item: creates InventoryTransaction (waste type)
   *   9. Commits transaction
   *
   * Business Rules:
   *   - Waste permanently removes stock from inventory
   *   - Every item creates exactly one 'waste' InventoryTransaction
   *   - Batch and CurrentStock are updated ONLY through InventoryTransactionService
   *   - Entire workflow is atomic
   */
  async create(data) {
    const { warehouse: warehouseId, wasteDate, reason, notes, createdBy, items } = data;

    // ── Validate reason is provided ────────────────────────────────────────
    if (!reason || !reason.trim()) {
      throw new AppError('Waste reason is required', 400);
    }

    // ── Validate warehouse exists and is active ───────────────────────────
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    if (!warehouse.isActive) throw new AppError('Cannot process waste for inactive warehouse', 400);

    // ── Validate all products exist and are active ───────────────────────
    const productIds = [...new Set(items.map((item) => item.product))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    for (const p of products) {
      if (!p.isActive) throw new AppError(`Product "${p.name}" is inactive`, 400);
      productMap[p._id.toString()] = p;
    }
    for (const pid of productIds) {
      if (!productMap[pid]) throw new AppError(`Product ${pid} not found`, 404);
    }

    // ── Validate each item's batch and quantity ───────────────────────────
    const batchMap = {};

    for (const [index, item] of items.entries()) {
      if (item.quantity <= 0) {
        throw new AppError(`Item ${index + 1}: Quantity must be positive`, 400);
      }

      const batch = await batchRepository.findById(item.batch);
      if (!batch) throw new AppError(`Item ${index + 1}: Batch not found`, 404);

      // Verify batch belongs to the warehouse
      const batchWarehouseId = batch.warehouse._id ? batch.warehouse._id.toString() : batch.warehouse.toString();
      if (batchWarehouseId !== warehouseId) {
        throw new AppError(`Item ${index + 1}: Batch does not belong to the specified warehouse`, 400);
      }

      // Verify batch belongs to the specified product
      const batchProductId = batch.product._id ? batch.product._id.toString() : batch.product.toString();
      if (batchProductId !== item.product) {
        throw new AppError(`Item ${index + 1}: Batch does not belong to the specified product`, 400);
      }

      // Verify batch is active
      if (batch.status !== 'active') {
        throw new AppError(`Item ${index + 1}: Batch is not active (status: ${batch.status})`, 400);
      }

      // Verify available quantity is sufficient
      if (batch.availableQuantity < item.quantity) {
        throw new AppError(`Item ${index + 1}: Insufficient available quantity. Requested: ${item.quantity}, Available: ${batch.availableQuantity}`, 400);
      }

      // Capture the batch's unitCost
      batchMap[item.batch] = batch.unitCost || 0;
    }

    // ── Generate waste number ──────────────────────────────────────────────
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Waste.countDocuments();
    const wasteNumber = `WST-${datePart}-${String(count + 1).padStart(4, '0')}`;

    // ── Execute all operations atomically ──────────────────────────────────
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // ── Create the Waste document (status: completed) ────────────────────
      const waste = await wasteRepository.create({
        wasteNumber,
        warehouse: warehouseId,
        wasteDate: wasteDate || new Date(),
        reason,
        notes,
        createdBy,
        status: 'completed',
        items: [], // items added below
      }, session);

      // ── Process each item ─────────────────────────────────────────────
      const processedItems = [];

      for (const item of items) {
        const { product: productId, batch: batchId, quantity } = item;
        const effectiveUnitCost = batchMap[batchId] || 0;

        // ── Create waste inventory transaction ────────────────────────────
        const transactionData = {
          batch: batchId,
          product: productId,
          warehouse: warehouseId,
          transactionType: 'waste',
          quantity,
          unitCost: effectiveUnitCost,
          referenceType: 'Waste',
          referenceId: waste._id,
          reason: reason || 'Waste disposal',
          performedBy: createdBy,
          notes: notes || undefined,
        };

        await inventoryTransactionService.create(transactionData, { session });

        processedItems.push({
          product: productId,
          batch: batchId,
          quantity,
        });
      }

      // ── Update the Waste document with processed items ───────────────────
      waste.items = processedItems;
      await waste.save({ session });

      await session.commitTransaction();

      return wasteRepository.findById(waste._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  /**
   * Lists waste documents with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.wasteNumber = { $regex: query.search, $options: 'i' };
    }
    if (query.startDate || query.endDate) {
      filter.wasteDate = {};
      if (query.startDate) filter.wasteDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.wasteDate.$lte = new Date(query.endDate);
    }

    return wasteRepository.findAll(filter);
  },

  /**
   * Gets a single waste document by ID.
   */
  async getById(id) {
    const waste = await wasteRepository.findById(id);
    if (!waste) throw new AppError('Waste document not found', 404);
    return waste;
  },

  /**
   * Cancels (voids) a completed waste document.
   *
   * Workflow:
   *   1. Validates the waste exists and is in 'completed' status
   *   2. For each item:
   *      a. Creates a cancellation transaction that adds quantity back to the batch
   *   3. Updates the waste status to 'cancelled'
   *   4. All operations in a single MongoDB transaction
   */
  async cancel(id, performedBy, reason) {
    const waste = await wasteRepository.findById(id);
    if (!waste) throw new AppError('Waste document not found', 404);
    if (waste.status !== 'completed') {
      throw new AppError(`Cannot cancel a waste record with status "${waste.status}". Only completed waste records can be cancelled.`, 400);
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      for (const item of waste.items) {
        const { product, batch: batchId, quantity } = item;

        // ── Create a reversal transaction that adds quantity back ──────────
        // Waste is a deduction (waste: -1 direction), so we need a reversal
        // transaction (reversal: +1 direction) to add the quantity back
        await inventoryTransactionService.create({
          batch: batchId,
          product,
          warehouse: waste.warehouse,
          transactionType: 'reversal',
          quantity,
          unitCost: 0,
          referenceType: 'Waste',
          referenceId: waste._id,
          reason: reason || `Cancellation of waste ${waste.wasteNumber} (reverse waste)`,
          performedBy,
          notes: `Reversed waste: added ${quantity} units back to batch`,
        }, { session });
      }

      // ── Update the waste status to cancelled ────────────────────────────
      await wasteRepository.updateById(waste._id, {
        status: 'cancelled',
        notes: waste.notes
          ? `${waste.notes} | CANCELLED: ${reason || 'No reason provided'}`
          : `CANCELLED: ${reason || 'No reason provided'}`,
      }, session);

      await session.commitTransaction();
      return wasteRepository.findById(waste._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};

module.exports = wasteService;
