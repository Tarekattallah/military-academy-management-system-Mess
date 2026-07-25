const mongoose = require('mongoose');
const stockCountRepository = require('../repositories/stockCount.repository');
const batchRepository = require('../repositories/batch.repository');
const inventoryTransactionService = require('./inventoryTransaction.service');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const StockCount = require('../models/stockCount.model');
const AppError = require('../utils/AppError');

const stockCountService = {
  /**
   * Creates a Stock Count document.
   *
   * IMPORTANT: Creating a stock count does NOT affect inventory.
   * Inventory changes ONLY after the stock count is approved.
   */
  async create(data) {
    const { warehouse: warehouseId, countDate, notes, createdBy, items } = data;

    // ── Validate warehouse exists and is active ───────────────────────────
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    if (!warehouse.isActive) throw new AppError('Cannot create stock count for inactive warehouse', 400);

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

    // ── Validate quantities are non-negative ──────────────────────────────
    for (const [index, item] of items.entries()) {
      if (item.systemQuantity < 0) {
        throw new AppError(`Item ${index + 1}: System quantity cannot be negative`, 400);
      }
      if (item.physicalQuantity < 0) {
        throw new AppError(`Item ${index + 1}: Physical quantity cannot be negative`, 400);
      }
    }

    // ── Generate count number ──────────────────────────────────────────────
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await StockCount.countDocuments();
    const countNumber = `SC-${datePart}-${String(count + 1).padStart(4, '0')}`;

    // ── Calculate differences and build items ──────────────────────────────
    const processedItems = items.map((item) => {
      const difference = item.physicalQuantity - item.systemQuantity;
      return {
        product: item.product,
        batch: item.batch,
        systemQuantity: item.systemQuantity,
        physicalQuantity: item.physicalQuantity,
        difference,
      };
    });

    // ── Create the StockCount document (status: draft) ────────────────────
    // NO inventory changes at this point.
    const stockCount = await stockCountRepository.create({
      countNumber,
      warehouse: warehouseId,
      countDate: countDate || new Date(),
      status: 'draft',
      notes,
      createdBy,
      items: processedItems,
    });

    return stockCountRepository.findById(stockCount._id);
  },

  /**
   * Approves a Stock Count and creates inventory adjustment transactions.
   *
   * This is the ONLY point where inventory is affected.
   * Only 'completed' stock counts can be approved.
   *
   * The 'adjustment' transaction type uses a dynamic direction formula:
   *   delta = quantity - currentQuantity
   *
   * We pass:
   *   quantity = physicalQuantity
   *   currentQuantity = systemQuantity
   *
   * Result:
   *   delta = physicalQuantity - systemQuantity = difference
   *   difference > 0 → stock increases (surplus found)
   *   difference < 0 → stock decreases (shortage found)
   *   difference = 0 → no transaction created
   */
  async approve(id, approvedBy) {
    const stockCount = await stockCountRepository.findById(id);
    if (!stockCount) throw new AppError('Stock count not found', 404);
    if (stockCount.status !== 'completed') {
      throw new AppError(
        `Cannot approve stock count with status "${stockCount.status}". Only 'completed' stock counts can be approved.`,
        400
      );
    }

    // ── Snapshot Integrity Validation ──────────────────────────────────────
    // Verify that each batch's current availableQuantity matches the stored
    // systemQuantity. If inventory changed between creation and approval,
    // the adjustment would be incorrect, so we reject and require a recount.
    for (const [index, item] of stockCount.items.entries()) {
      const batch = await batchRepository.findById(item.batch);
      if (!batch) {
        throw new AppError(`Item ${index + 1}: Batch ${item.batch} no longer exists. A new stock count is required.`, 400);
      }

      const batchAvailable = batch.availableQuantity;
      if (batchAvailable !== item.systemQuantity) {
        throw new AppError(
          `Item ${index + 1}: Batch "${batch.batchNumber}" current quantity (${batchAvailable}) differs from stock count snapshot (${item.systemQuantity}). ` +
          `Inventory changed after the count was created. A new stock count is required.`,
          409
        );
      }
    }

    // ── Execute all operations atomically ──────────────────────────────────
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // ── Update status to approved ──────────────────────────────────────
      await stockCountRepository.updateById(
        id,
        {
          status: 'approved',
          approvedBy,
          approvedAt: new Date(),
        },
        session
      );

      // ── Process each item with a non-zero difference ─────────────────────
      for (const item of stockCount.items) {
        if (item.difference === 0) continue; // No adjustment needed

        const { product: productId, batch: batchId, systemQuantity, physicalQuantity } = item;

        // Get warehouse ID (handle both populated and raw ObjectId)
        const warehouseId = stockCount.warehouse._id
          ? stockCount.warehouse._id.toString()
          : stockCount.warehouse.toString();

        // ── Create adjustment inventory transaction ───────────────────────
        // The 'adjustment' type formula: delta = quantity - currentQuantity
        // We already validated that current batch quantity matches systemQuantity,
        // so using systemQuantity as currentQuantity is correct.
        await inventoryTransactionService.create(
          {
            batch: batchId,
            product: productId,
            warehouse: warehouseId,
            transactionType: 'adjustment',
            quantity: physicalQuantity,
            unitCost: 0,
            referenceType: 'StockCount',
            referenceId: stockCount._id,
            reason: `Stock count adjustment: system=${systemQuantity}, physical=${physicalQuantity}, diff=${item.difference > 0 ? '+' : ''}${item.difference}`,
            performedBy: approvedBy,
            notes: stockCount.notes || undefined,
            currentQuantity: systemQuantity,
          },
          { session }
        );
      }

      await session.commitTransaction();

      return stockCountRepository.findById(id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  /**
   * Lists stock count documents with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.countNumber = { $regex: query.search, $options: 'i' };
    }
    if (query.startDate || query.endDate) {
      filter.countDate = {};
      if (query.startDate) filter.countDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.countDate.$lte = new Date(query.endDate);
    }

    return stockCountRepository.findAll(filter);
  },

  /**
   * Gets a single stock count document by ID.
   */
  async getById(id) {
    const stockCount = await stockCountRepository.findById(id);
    if (!stockCount) throw new AppError('Stock count not found', 404);
    return stockCount;
  },

  /**
   * Cancels (voids) a stock count document.
   *
   * Workflow:
   *   1. Validates the stock count exists
   *   2. If status is 'approved', reverses all adjustments by creating
   *      cancellation transactions (reverse of the original adjustments)
   *   3. If status is 'draft' or 'completed', no inventory reversal needed
   *      because no inventory changes were made yet
   *   4. Updates the stock count status to 'cancelled'
   *   5. All operations in a single MongoDB transaction
   */
  async cancel(id, performedBy, reason) {
    const stockCount = await stockCountRepository.findById(id);
    if (!stockCount) throw new AppError('Stock count not found', 404);
    if (stockCount.status === 'cancelled') {
      throw new AppError('Stock count is already cancelled', 400);
    }

    if (stockCount.status === 'approved') {
      // ── Approved stock counts need inventory reversal ──────────────────
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        // Reverse each adjustment
        for (const item of stockCount.items) {
          if (item.difference === 0) continue;

          const { product: productId, batch: batchId, systemQuantity, physicalQuantity } = item;

          const warehouseId = stockCount.warehouse._id
            ? stockCount.warehouse._id.toString()
            : stockCount.warehouse.toString();

          // Create a reversal adjustment (set quantity back to systemQuantity)
          // Using the 'adjustment' type with currentQuantity = physicalQuantity
          await inventoryTransactionService.create(
            {
              batch: batchId,
              product: productId,
              warehouse: warehouseId,
              transactionType: 'adjustment',
              quantity: systemQuantity,
              unitCost: 0,
              referenceType: 'StockCount',
              referenceId: stockCount._id,
              reason: reason || `Cancellation of stock count ${stockCount.countNumber} (reverse adjustment)`,
              performedBy,
              notes: `Reversed stock count adjustment: restored ${systemQuantity} units`,
              currentQuantity: physicalQuantity,
            },
            { session }
          );
        }

        // Update status to cancelled
        await stockCountRepository.updateById(
          stockCount._id,
          {
            status: 'cancelled',
            approvedBy: undefined,
            approvedAt: undefined,
            notes: stockCount.notes
              ? `${stockCount.notes} | CANCELLED: ${reason || 'No reason provided'}`
              : `CANCELLED: ${reason || 'No reason provided'}`,
          },
          session
        );

        await session.commitTransaction();
        return stockCountRepository.findById(stockCount._id);
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }

    // ── Draft or completed stock counts: no inventory reversal needed ────
    await stockCountRepository.updateById(stockCount._id, {
      status: 'cancelled',
      notes: stockCount.notes
        ? `${stockCount.notes} | CANCELLED: ${reason || 'No reason provided'}`
        : `CANCELLED: ${reason || 'No reason provided'}`,
    });

    return stockCountRepository.findById(stockCount._id);
  },
};

module.exports = stockCountService;
