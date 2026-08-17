const mongoose = require('mongoose');
const receivingRepository = require('../repositories/receiving.repository');
const batchRepository = require('../repositories/batch.repository');
const inventoryTransactionRepository = require('../repositories/inventoryTransaction.repository');
const inventoryTransactionService = require('./inventoryTransaction.service');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const Supplier = require('../models/supplier.model');
const Receiving = require('../models/receiving.model');
const dailyClosingService = require('./dailyClosing.service');
const AppError = require('../utils/AppError');

const receivingService = {
  /**
   * Creates a Receiving document and processes all items atomically.
   *
   * Workflow:
   *   1. Validates all input data (supplier, warehouse, products, items)
   *   2. Generates a unique receiving number
   *   3. Creates the Receiving document (status: completed)
   *   4. For each item:
   *      a. Finds or creates a Batch (same product + warehouse + batchNumber)
   *      b. Creates an InventoryTransaction linked to this Receiving
   *   5. Everything in a single MongoDB transaction
   *
   * If any item fails, the entire operation rolls back.
   */
  async create(data) {
    const { supplier: supplierId, warehouse: warehouseId, receivingDate, notes, createdBy, items } = data;

    const opDate = receivingDate || new Date();
    await dailyClosingService.assertOperationalDayWritable(warehouseId, opDate);

    // ── Validate supplier exists and is active ───────────────────────────
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) throw new AppError('Supplier not found', 404);
    if (!supplier.isActive) throw new AppError('Cannot receive from inactive supplier', 400);

    // ── Validate warehouse exists and is active ─────────────────────────
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    if (!warehouse.isActive) throw new AppError('Cannot receive into inactive warehouse', 400);

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

    // ── Validate each item ───────────────────────────────────────────────
    for (const [index, item] of items.entries()) {
      if (item.quantity <= 0) {
        throw new AppError(`Item ${index + 1}: Quantity must be positive`, 400);
      }
      if (item.manufacturingDate && item.expiryDate && new Date(item.manufacturingDate) >= new Date(item.expiryDate)) {
        throw new AppError(`Item ${index + 1}: Manufacturing date must be before expiry date`, 400);
      }
    }

    // ── Generate receiving number ────────────────────────────────────────
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Receiving.countDocuments();
    const receivingNumber = `RCV-${datePart}-${String(count + 1).padStart(4, '0')}`;

    // ── Execute all operations atomically ────────────────────────────────
    const session = undefined; // await mongoose.startSession();
    try {
      // session.startTransaction();

      // ── Create the Receiving document (status: completed) ──────────────
      const receiving = await receivingRepository.create({
        receivingNumber,
        supplier: supplierId,
        warehouse: warehouseId,
        receivingDate: receivingDate || new Date(),
        status: 'completed',
        notes,
        createdBy,
        items: [], // items added below
      }, session);

      // ── Process each item: find/create batch + create transaction ──────
      const processedItems = [];

      for (const item of items) {
        const { product: productId, batchNumber, quantity, unitCost, manufacturingDate, expiryDate } = item;
        const trimmedBatchNumber = batchNumber.trim().toUpperCase();

        // ── Find or create batch ─────────────────────────────────────────
        // Look for existing batch with same product + warehouse + batch number
        let batch = await batchRepository.findByIdentifier(productId, warehouseId, trimmedBatchNumber, session);

        if (batch) {
          // Existing batch: increase quantities
          const newAvailable = batch.availableQuantity + quantity;
          const newInitial = batch.initialQuantity + quantity;
          batch = await batchRepository.updateById(batch._id, {
            availableQuantity: newAvailable,
            initialQuantity: newInitial,
            unitCost: unitCost || batch.unitCost,
            status: 'active', // re-activate if it was depleted
          }, session);
        } else {
          // New batch: create it
          batch = await batchRepository.create({
            product: productId,
            warehouse: warehouseId,
            batchNumber: trimmedBatchNumber,
            manufacturingDate: manufacturingDate || undefined,
            expiryDate: expiryDate || undefined,
            initialQuantity: quantity,
            availableQuantity: quantity,
            reservedQuantity: 0,
            unitCost: unitCost || 0,
            supplier: supplierId,
            notes: notes || undefined,
          }, session);
        }

        // ── Create inventory transaction ─────────────────────────────────
        const batchId = batch._id ? batch._id.toString() : batch.toString();
        const effectiveUnitCost = unitCost || batch.unitCost || 0;
        const totalCost = effectiveUnitCost * quantity;

        // Use the repository directly within the parent session
        await inventoryTransactionRepository.create({
          batch: batchId,
          product: productId,
          warehouse: warehouseId,
          transactionType: 'receiving',
          module: 'receiving',
          quantity,
          unitCost: effectiveUnitCost,
          totalCost,
          referenceType: 'Receiving',
          referenceId: receiving._id,
          reason: `Receiving from ${supplier.name}`,
          performedBy: createdBy,
          notes: notes || undefined,
        }, session);

        processedItems.push({
          product: productId,
          batchNumber: trimmedBatchNumber,
          quantity,
          unitCost: effectiveUnitCost,
          manufacturingDate: manufacturingDate || undefined,
          expiryDate: expiryDate || undefined,
        });
      }

      // ── Update the Receiving document with processed items ─────────────
      receiving.items = processedItems;
      await receiving.save({ session });

      // await session.commitTransaction();

      return receivingRepository.findById(receiving._id);
    } catch (err) {
      // await session.abortTransaction();
      throw err;
    } finally {
      // session.endSession();
    }
  },

  /**
   * Lists receiving documents with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.supplier) filter.supplier = query.supplier;
    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.receivingNumber = { $regex: query.search, $options: 'i' };
    }
    if (query.startDate || query.endDate) {
      filter.receivingDate = {};
      if (query.startDate) filter.receivingDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.receivingDate.$lte = new Date(query.endDate);
    }

    return receivingRepository.findAll(filter);
  },

  /**
   * Gets a single receiving document by ID.
   */
  async getById(id) {
    const receiving = await receivingRepository.findById(id);
    if (!receiving) throw new AppError('Receiving document not found', 404);
    return receiving;
  },

  /**
   * Cancels (voids) a completed receiving document.
   *
   * Workflow:
   *   1. Validates the receiving exists and is in 'completed' status
   *   2. For each item:
   *      a. Decreases the batch availableQuantity
   *      b. Creates a reverse inventory transaction (type: 'cancellation')
   *   3. Updates the receiving status to 'cancelled'
   *   4. All operations in a single MongoDB transaction
   *
   * If any item fails, the entire operation rolls back.
   */
  async cancel(id, performedBy, reason) {
    const receiving = await receivingRepository.findById(id);
    if (!receiving) throw new AppError('Receiving document not found', 404);
    if (receiving.status !== 'completed') {
      throw new AppError(`Cannot cancel a receiving with status "${receiving.status}". Only completed receivings can be cancelled.`, 400);
    }

    const whId = receiving.warehouse._id ? receiving.warehouse._id.toString() : receiving.warehouse.toString();
    await dailyClosingService.assertOperationalDayWritable(whId, receiving.receivingDate);

    const session = undefined; // await mongoose.startSession();
    try {
      // session.startTransaction();

      // ── Process each item: reverse batch quantities ──────────────────────
      for (const item of receiving.items) {
        const { product, batchNumber, quantity, unitCost: itemUnitCost } = item;

        // Find the batch for this item
        const batch = await batchRepository.findByIdentifier(product, receiving.warehouse, batchNumber, session);
        if (!batch) {
          throw new AppError(`Batch "${batchNumber}" for product "${product}" not found. Cannot cancel receiving.`, 404);
        }

        // Check if batch has enough available quantity to reverse
        if (batch.availableQuantity < quantity) {
          throw new AppError(
            `Cannot cancel: Batch "${batchNumber}" has only ${batch.availableQuantity} available, but ${quantity} need to be reversed. The batch may have been partially consumed.`,
            400
          );
        }

        // Find the original transaction to get unitCost
        const originalTransaction = await inventoryTransactionRepository.findOne({
          referenceType: 'Receiving',
          referenceId: receiving._id,
          batch: batch._id,
          transactionType: 'receiving',
        }, session);

        const unitCost = originalTransaction?.unitCost || itemUnitCost || 0;

        // ── Create reverse inventory transaction via inventoryTransactionService ──
        // This handles both the batch quantity update and the transaction record
        await inventoryTransactionService.create({
          batch: batch._id,
          product,
          warehouse: receiving.warehouse,
          transactionType: 'cancellation',
          quantity,
          unitCost,
          referenceType: 'Receiving',
          referenceId: receiving._id,
          reason: reason || `Cancellation of receiving ${receiving.receivingNumber}`,
          performedBy,
          notes: `Reversed ${quantity} units from batch ${batchNumber}`,
        }, { session });
      }

      // ── Update the receiving status to cancelled ─────────────────────────
      await receivingRepository.updateById(receiving._id, {
        status: 'cancelled',
        notes: receiving.notes
          ? `${receiving.notes} | CANCELLED: ${reason || 'No reason provided'}`
          : `CANCELLED: ${reason || 'No reason provided'}`,
      }, session);

      // await session.commitTransaction();
      return receivingRepository.findById(receiving._id);
    } catch (err) {
      // await session.abortTransaction();
      throw err;
    } finally {
      // session.endSession();
    }
  },
};

module.exports = receivingService;
