const mongoose = require('mongoose');
const transferRepository = require('../repositories/transfer.repository');
const batchRepository = require('../repositories/batch.repository');
const inventoryTransactionService = require('./inventoryTransaction.service');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const Transfer = require('../models/transfer.model');
const AppError = require('../utils/AppError');

const transferService = {
  /**
   * Creates a Transfer document and processes all items atomically.
   *
   * Workflow:
   *   1. Validates source warehouse (exists, active)
   *   2. Validates destination warehouse (exists, active, not same as source)
   *   3. Validates all products (exist, active)
   *   4. Validates source batches (exist, belong to source warehouse + product)
   *   5. Validates available quantity for each item
   *   6. Starts MongoDB transaction
   *   7. Creates Transfer document
   *   8. For each item:
   *      a. Creates TRANSFER_OUT transaction (deducts from source batch)
   *      b. Finds or creates destination batch
   *      c. Creates TRANSFER_IN transaction (adds to destination batch)
   *   9. Updates Transfer items
   *  10. Commits transaction
   *
   * If any step fails, the entire operation rolls back.
   */
  async create(data) {
    const { sourceWarehouse: sourceWarehouseId, destinationWarehouse: destinationWarehouseId, transferDate, notes, createdBy, items } = data;

    // ── Validate source warehouse ───────────────────────────────────────
    const sourceWarehouse = await Warehouse.findById(sourceWarehouseId);
    if (!sourceWarehouse) throw new AppError('Source warehouse not found', 404);
    if (!sourceWarehouse.isActive) throw new AppError('Source warehouse is inactive', 400);

    // ── Validate destination warehouse ──────────────────────────────────
    const destinationWarehouse = await Warehouse.findById(destinationWarehouseId);
    if (!destinationWarehouse) throw new AppError('Destination warehouse not found', 404);
    if (!destinationWarehouse.isActive) throw new AppError('Destination warehouse is inactive', 400);

    // ── Validate warehouses are not the same ────────────────────────────
    if (sourceWarehouseId === destinationWarehouseId) {
      throw new AppError('Source and destination warehouses cannot be the same', 400);
    }

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

    // ── Validate each item's source batch and available quantity ────────
    // Also capture the source batch's unitCost (transfers are internal movements,
    // so the cost remains unchanged — it is NOT a procurement event)
    const sourceBatchMap = {};

    for (const [index, item] of items.entries()) {
      if (item.quantity <= 0) {
        throw new AppError(`Item ${index + 1}: Quantity must be positive`, 400);
      }

      const batch = await batchRepository.findById(item.sourceBatch);
      if (!batch) throw new AppError(`Item ${index + 1}: Source batch not found`, 404);

      // Verify batch belongs to source warehouse
      const batchWarehouseId = batch.warehouse._id ? batch.warehouse._id.toString() : batch.warehouse.toString();
      if (batchWarehouseId !== sourceWarehouseId) {
        throw new AppError(`Item ${index + 1}: Source batch does not belong to source warehouse`, 400);
      }

      // Verify batch belongs to the specified product
      const batchProductId = batch.product._id ? batch.product._id.toString() : batch.product.toString();
      if (batchProductId !== item.product) {
        throw new AppError(`Item ${index + 1}: Source batch does not belong to the specified product`, 400);
      }

      // Verify batch is active
      if (batch.status !== 'active') {
        throw new AppError(`Item ${index + 1}: Source batch is not active (status: ${batch.status})`, 400);
      }

      // Verify available quantity
      if (batch.availableQuantity < item.quantity) {
        throw new AppError(`Item ${index + 1}: Insufficient available quantity. Requested: ${item.quantity}, Available: ${batch.availableQuantity}`, 400);
      }

      // Capture the source batch's unitCost — this is the true cost of the goods
      // being transferred. A transfer is an internal stock movement, NOT a
      // purchase or adjustment. The unit cost must remain unchanged.
      sourceBatchMap[item.sourceBatch] = batch.unitCost || 0;
    }

    // ── Generate transfer number ────────────────────────────────────────
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Transfer.countDocuments();
    const transferNumber = `TRF-${datePart}-${String(count + 1).padStart(4, '0')}`;

    // ── Execute all operations atomically ────────────────────────────────
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // ── Process each item first to build processedItems ──────────────
      // We process items before creating the Transfer document so that
      // the document is created with a fully-populated items array,
      // satisfying the 'at least one item' validator in one shot.
      const processedItems = [];

      for (const item of items) {
        const { product: productId, sourceBatch: sourceBatchId, destinationBatchNumber, quantity } = item;
        const trimmedDestinationBatchNumber = destinationBatchNumber.trim().toUpperCase();

        // ── Determine unit cost from source batch ────────────────────────
        // A transfer is an internal stock movement, NOT a procurement event.
        // The unit cost of the goods being moved does NOT change when they
        // are transferred between warehouses. We always use the source batch's
        // unit cost for both the TRANSFER_OUT and TRANSFER_IN transactions.
        const effectiveUnitCost = sourceBatchMap[sourceBatchId] || 0;

        // ── Step B: Find or create destination batch ────────────────────
        // Look for existing batch with same product + destination warehouse + batch number
        let destinationBatch = await batchRepository.findByIdentifier(productId, destinationWarehouseId, trimmedDestinationBatchNumber, session);

        if (destinationBatch) {
          // Existing destination batch found. We do NOT update its unitCost
          // because a transfer is an internal movement — the cost of goods
          // already in this warehouse should not be overwritten. Only ensure
          // the batch is active so TRANSFER_IN can add quantity.
          if (destinationBatch.status !== 'active') {
            destinationBatch = await batchRepository.updateById(destinationBatch._id, {
              status: 'active',
            }, session);
          }
        } else {
          // New destination batch. Set its unitCost to the source batch's
          // unit cost (the true cost of the goods being moved). The
          // availableQuantity starts at 0 — TRANSFER_IN will add the quantity.
          destinationBatch = await batchRepository.create({
            product: productId,
            warehouse: destinationWarehouseId,
            batchNumber: trimmedDestinationBatchNumber,
            initialQuantity: quantity,
            availableQuantity: 0,
            reservedQuantity: 0,
            unitCost: effectiveUnitCost,
            notes: notes || undefined,
          }, session);
        }

        const destinationBatchId = destinationBatch._id ? destinationBatch._id.toString() : destinationBatch.toString();

        processedItems.push({
          product: productId,
          sourceBatch: sourceBatchId,
          destinationBatchNumber: trimmedDestinationBatchNumber,
          quantity,
          unitCost: effectiveUnitCost,
          // store destinationBatchId temporarily for transaction step below
          _destBatchId: destinationBatchId,
        });
      }

      // ── Create the Transfer document with all items populated ─────────
      // Creating with items already set avoids triggering the
      // 'at least one item' validator with an empty array.
      const transfer = await transferRepository.create({
        transferNumber,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destinationWarehouseId,
        transferDate: transferDate || new Date(),
        status: 'completed',
        notes,
        createdBy,
        items: processedItems.map(({ _destBatchId, ...rest }) => rest),
      }, session);

      // ── Create inventory transactions for each item ───────────────────
      for (const item of processedItems) {
        const { product: productId, sourceBatch: sourceBatchId, quantity, unitCost: effectiveUnitCost, _destBatchId: destinationBatchId } = item;

        // ── Step A: Create TRANSFER_OUT transaction ──────────────────────
        // Deducts from the source batch's availableQuantity using the
        // source batch's original unit cost.
        const transferOutData = {
          batch: sourceBatchId,
          product: productId,
          warehouse: sourceWarehouseId,
          transactionType: 'transfer_out',
          quantity,
          unitCost: effectiveUnitCost,
          referenceType: 'Transfer',
          referenceId: transfer._id,
          reason: `Transfer to ${destinationWarehouse.name}`,
          performedBy: createdBy,
          notes: notes || undefined,
        };

        await inventoryTransactionService.create(transferOutData, { session });

        // ── Step C: Create TRANSFER_IN transaction ──────────────────────
        // Adds to the destination batch's availableQuantity using the same
        // unit cost as the source batch (cost does not change on transfer).
        const transferInData = {
          batch: destinationBatchId,
          product: productId,
          warehouse: destinationWarehouseId,
          transactionType: 'transfer_in',
          quantity,
          unitCost: effectiveUnitCost,
          referenceType: 'Transfer',
          referenceId: transfer._id,
          reason: `Transfer from ${sourceWarehouse.name}`,
          performedBy: createdBy,
          notes: notes || undefined,
        };

        await inventoryTransactionService.create(transferInData, { session });
      }

      await session.commitTransaction();

      return transferRepository.findById(transfer._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  /**
   * Lists transfer documents with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.sourceWarehouse) filter.sourceWarehouse = query.sourceWarehouse;
    if (query.destinationWarehouse) filter.destinationWarehouse = query.destinationWarehouse;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.transferNumber = { $regex: query.search, $options: 'i' };
    }
    if (query.startDate || query.endDate) {
      filter.transferDate = {};
      if (query.startDate) filter.transferDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.transferDate.$lte = new Date(query.endDate);
    }

    return transferRepository.findAll(filter);
  },

  /**
   * Gets a single transfer document by ID.
   */
  async getById(id) {
    const transfer = await transferRepository.findById(id);
    if (!transfer) throw new AppError('Transfer document not found', 404);
    return transfer;
  },

  /**
   * Cancels (voids) a completed transfer document.
   *
   * Workflow:
   *   1. Validates the transfer exists and is in 'completed' status
   *   2. For each item:
   *      a. Reverse TRANSFER_IN: deduct from destination batch
   *      b. Reverse TRANSFER_OUT: add back to source batch
   *      c. Create cancellation transactions for audit trail
   *   3. Updates the transfer status to 'cancelled'
   *   4. All operations in a single MongoDB transaction
   */
  async cancel(id, performedBy, reason) {
    const transfer = await transferRepository.findById(id);
    if (!transfer) throw new AppError('Transfer document not found', 404);
    if (transfer.status !== 'completed') {
      throw new AppError(`Cannot cancel a transfer with status "${transfer.status}". Only completed transfers can be cancelled.`, 400);
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      for (const item of transfer.items) {
        const { product, sourceBatch, destinationBatchNumber, quantity } = item;

        // ── Reverse TRANSFER_OUT: add back to source batch ────────────────
        // Create a cancellation transaction that adds quantity back to source batch
        await inventoryTransactionService.create({
          batch: sourceBatch,
          product,
          warehouse: transfer.sourceWarehouse,
          transactionType: 'cancellation',
          quantity,
          unitCost: item.unitCost || 0,
          referenceType: 'Transfer',
          referenceId: transfer._id,
          reason: reason || `Cancellation of transfer ${transfer.transferNumber} (reverse transfer_out)`,
          performedBy,
          notes: `Reversed transfer_out: added ${quantity} units back to source batch`,
        }, { session });

        // ── Reverse TRANSFER_IN: deduct from destination batch ────────────
        // Find the destination batch
        const destinationBatch = await batchRepository.findByIdentifier(product, transfer.destinationWarehouse, destinationBatchNumber, session);
        if (destinationBatch) {
          await inventoryTransactionService.create({
            batch: destinationBatch._id,
            product,
            warehouse: transfer.destinationWarehouse,
            transactionType: 'cancellation',
            quantity,
            unitCost: item.unitCost || 0,
            referenceType: 'Transfer',
            referenceId: transfer._id,
            reason: reason || `Cancellation of transfer ${transfer.transferNumber} (reverse transfer_in)`,
            performedBy,
            notes: `Reversed transfer_in: deducted ${quantity} units from destination batch`,
          }, { session });
        }
      }

      // ── Update the transfer status to cancelled ─────────────────────────
      await transferRepository.updateById(transfer._id, {
        status: 'cancelled',
        notes: transfer.notes
          ? `${transfer.notes} | CANCELLED: ${reason || 'No reason provided'}`
          : `CANCELLED: ${reason || 'No reason provided'}`,
      }, session);

      await session.commitTransaction();
      return transferRepository.findById(transfer._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};

module.exports = transferService;
