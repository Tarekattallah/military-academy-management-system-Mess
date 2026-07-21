const mongoose = require('mongoose');
const inventoryTransactionRepository = require('../repositories/inventoryTransaction.repository');
const batchRepository = require('../repositories/batch.repository');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const AppError = require('../utils/AppError');

// ── Transaction type configuration ──────────────────────────────────────
// Defines the quantity direction (+ for increase, - for decrease) for each type
const TRANSACTION_DIRECTION = {
  receiving: 1,
  transfer_in: 1,
  return: 1,
  return_to_supplier: -1,
  adjustment: (currentQuantity, quantity) => quantity - currentQuantity, // dynamic: sign depends on whether we're adding or removing
  transfer_out: -1,
  waste: -1,
  issue: -1,
  reservation: 0, // reservation changes reservedQuantity, not availableQuantity
  reservation_cancel: 0, // cancels reservation, changes reservedQuantity
};

// Map transaction types to their source modules for audit
const TRANSACTION_TYPE_TO_MODULE = {
  receiving: 'receiving',
  transfer_out: 'transfers',
  transfer_in: 'transfers',
  return: 'returns',
  return_to_supplier: 'returns',
  waste: 'waste',
  adjustment: 'manual',
  issue: 'meal-issue',
  reservation: 'meal-issue',
  reservation_cancel: 'meal-issue',
};

// ── Internal: Update batch quantity (only called by this service) ───────
async function updateBatchQuantity(batchId, transactionType, quantity, currentQuantity, session) {
  const batch = await batchRepository.findById(batchId, session);
  if (!batch) throw new AppError('Batch not found', 404);

  const direction = TRANSACTION_DIRECTION[transactionType];
  if (direction === undefined) throw new AppError(`Invalid transaction type: ${transactionType}`, 400);

  let delta;

  if (typeof direction === 'function') {
    // Dynamic direction (e.g., adjustment determines sign based on values)
    delta = direction(currentQuantity, quantity);
  } else {
    delta = direction * quantity;
  }

  // For reservation types, adjust reservedQuantity instead of availableQuantity
  if (transactionType === 'reservation') {
    const newReserved = batch.reservedQuantity + quantity;
    if (newReserved < 0) throw new AppError('Reserved quantity cannot be negative', 400);
    if (newReserved > batch.availableQuantity) throw new AppError('Reserved quantity exceeds available quantity', 400);
    return batchRepository.updateById(batchId, { reservedQuantity: newReserved }, session);
  }

  if (transactionType === 'reservation_cancel') {
    const newReserved = batch.reservedQuantity - quantity;
    if (newReserved < 0) throw new AppError('Reserved quantity cannot be negative', 400);
    return batchRepository.updateById(batchId, { reservedQuantity: newReserved }, session);
  }

  // Standard quantity adjustment
  const newAvailable = batch.availableQuantity + delta;
  if (newAvailable < 0) throw new AppError('Insufficient available quantity', 400);

  const updates = { availableQuantity: newAvailable };

  // Auto-set status to depleted when quantity reaches 0
  if (newAvailable === 0 && batch.status === 'active') {
    updates.status = 'depleted';
  }

  return batchRepository.updateById(batchId, updates, session);
}

// ── Public API ──────────────────────────────────────────────────────────

const inventoryTransactionService = {
  /**
   * Creates an inventory transaction and updates batch quantities atomically.
   *
   * This is the SINGLE entry point for all inventory movements.
   * Future modules (Receiving, Transfer, Waste, etc.) MUST call this method.
   *
   * Atomicity: Uses MongoDB transactions (startSession + commit/abortTransaction).
   * If the batch update fails, the transaction record is automatically rolled back.
   *
   * Audit trail: Every transaction records:
   *   - performedBy: Who performed the action
   *   - transactionDate: When it happened
   *   - module: Which module generated it
   *   - referenceType + referenceId: Which document generated it
   *   - reason: Why it was performed
   *
   * @param {Object} data - Transaction data
   * @param {string} data.batch - Batch ID
   * @param {string} data.product - Product ID
   * @param {string} data.warehouse - Warehouse ID
   * @param {string} data.transactionType - Type of transaction
   * @param {number} data.quantity - Quantity (always positive; direction is determined by type)
   * @param {number} [data.unitCost] - Unit cost at time of transaction
   * @param {string} [data.referenceType] - Reference document type (e.g., 'Receiving', 'Waste')
   * @param {string} [data.referenceId] - Reference document ID
   * @param {string} [data.reason] - Reason for the transaction
   * @param {string} data.performedBy - User ID who performed the transaction
   * @param {string} [data.notes] - Additional notes
   * @param {Object} [options] - Optional parameters
   * @param {Object} [options.session] - MongoDB session for nested transactions
   * @param {number} [data.currentQuantity] - For 'adjustment' type, the current physical quantity
   */
  async create(data, options = {}) {
    const { batch: batchId, product: productId, warehouse: warehouseId, transactionType, quantity, unitCost, referenceType, referenceId, reason, performedBy, notes, currentQuantity } = data;
    const { session: externalSession } = options;

    if (quantity < 0) throw new AppError('Quantity must be a positive number', 400);

    // ── Validate product exists and is active ───────────────────────────
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);
    if (!product.isActive) throw new AppError('Cannot create transaction for inactive product', 400);

    // ── Validate warehouse exists and is active ─────────────────────────
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    if (!warehouse.isActive) throw new AppError('Cannot create transaction for inactive warehouse', 400);

    // ── Validate batch exists ───────────────────────────────────────────
    // Use the session if provided (for nested transactions)
    const batch = await batchRepository.findById(batchId, externalSession);
    if (!batch) throw new AppError('Batch not found', 404);

    // ── Verify batch belongs to the correct product and warehouse ───────
    // Handle both populated object and raw ID
    const batchProductId = batch.product._id ? batch.product._id.toString() : batch.product.toString();
    const batchWarehouseId = batch.warehouse._id ? batch.warehouse._id.toString() : batch.warehouse.toString();

    if (batchProductId !== productId) {
      throw new AppError('Batch does not belong to the specified product', 400);
    }
    if (batchWarehouseId !== warehouseId) {
      throw new AppError('Batch does not belong to the specified warehouse', 400);
    }

    // ── Calculate total cost ────────────────────────────────────────────
    const effectiveUnitCost = unitCost || batch.unitCost || 0;
    const totalCost = effectiveUnitCost * quantity;

    // ── Determine module from transaction type ──────────────────────────
    const module = TRANSACTION_TYPE_TO_MODULE[transactionType] || 'manual';

    // ── Execute transaction and batch update atomically ─────────────────
    // If an external session is provided (e.g., from Receiving workflow),
    // use it to participate in the parent transaction. Otherwise, start a
    // standalone session.
    async function run() {
      const currentStockService = require('./currentStock.service');

      if (externalSession) {
        // Parent manages commit/abort — just create the records
        const transaction = await inventoryTransactionRepository.create({
          batch: batchId,
          product: productId,
          warehouse: warehouseId,
          transactionType,
          module,
          quantity,
          unitCost: effectiveUnitCost,
          totalCost,
          referenceType,
          referenceId,
          reason,
          performedBy,
          notes,
        }, externalSession);

        await updateBatchQuantity(batchId, transactionType, quantity, currentQuantity, externalSession);

        // Update CurrentStock read model within the same session
        await currentStockService.updateFromTransaction(productId, warehouseId, externalSession);

        return inventoryTransactionRepository.findById(transaction._id);
      }

      // Standalone transaction (no parent session)
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const transaction = await inventoryTransactionRepository.create({
          batch: batchId,
          product: productId,
          warehouse: warehouseId,
          transactionType,
          module,
          quantity,
          unitCost: effectiveUnitCost,
          totalCost,
          referenceType,
          referenceId,
          reason,
          performedBy,
          notes,
        }, session);

        await updateBatchQuantity(batchId, transactionType, quantity, currentQuantity, session);

        // Update CurrentStock read model within the same session
        await currentStockService.updateFromTransaction(productId, warehouseId, session);

        await session.commitTransaction();

        return inventoryTransactionRepository.findById(transaction._id);
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }

    return run();
  },

  /**
   * Lists inventory transactions with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.batch) filter.batch = query.batch;
    if (query.product) filter.product = query.product;
    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.transactionType) filter.transactionType = query.transactionType;
    if (query.module) filter.module = query.module;
    if (query.referenceType) filter.referenceType = query.referenceType;
    if (query.referenceId) filter.referenceId = query.referenceId;
    if (query.startDate || query.endDate) {
      filter.transactionDate = {};
      if (query.startDate) filter.transactionDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.transactionDate.$lte = new Date(query.endDate);
    }

    return inventoryTransactionRepository.findAll(filter);
  },

  /**
   * Gets a single transaction by ID.
   */
  async getById(id) {
    const transaction = await inventoryTransactionRepository.findById(id);
    if (!transaction) throw new AppError('Inventory transaction not found', 404);
    return transaction;
  },
};

module.exports = inventoryTransactionService;
