const mongoose = require('mongoose');
const returnRepository = require('../repositories/return.repository');
const batchRepository = require('../repositories/batch.repository');
const inventoryTransactionService = require('./inventoryTransaction.service');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const Supplier = require('../models/supplier.model');
const Return = require('../models/return.model');
const AppError = require('../utils/AppError');

// ── Reference type to model mapping ──────────────────────────────────────
// Every internal return must reference a previous outbound document.
// IMPORTANT: Only add entries here when the corresponding module is
// actually implemented in the codebase.
const REFERENCE_MODEL_MAP = {
  Transfer: require('../models/transfer.model'),
};

const returnService = {
  /**
   * Creates a Return document and processes all items atomically.
   *
   * Workflow:
   *   1. Validates return type
   *   2. Validates warehouse (exists, active)
   *   3. Validates products (exist, active)
   *   4. Validates batches (exist, belong to warehouse + product)
   *   5. For internal_return: validates reference document exists
   *   6. For return_to_supplier: validates supplier + available quantity
   *   7. Generates return number
   *   8. Starts MongoDB transaction
   *   9. Creates Return document (with reference if internal)
   *  10. For each item: creates InventoryTransaction(s)
   *  11. Commits transaction
   *
   * Business Rules:
   *   - return_to_supplier: decreases stock, requires supplier reference
   *   - internal_return: increases stock, REQUIRES reference to previous
   *     outbound document (Issue, Transfer, Waste, Distribution) to
   *     maintain inventory integrity (stock cannot appear from nowhere)
   *   - Entire workflow is atomic
   */
  async create(data) {
    const { returnType, warehouse: warehouseId, supplier: supplierId, referenceType, referenceId, returnDate, reason, notes, createdBy, items } = data;

    // ── Validate return type ───────────────────────────────────────────────
    const validTypes = ['return_to_supplier', 'internal_return'];
    if (!validTypes.includes(returnType)) {
      throw new AppError(`Invalid return type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    // ── Validate warehouse exists and is active ───────────────────────────
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    if (!warehouse.isActive) throw new AppError('Cannot process return for inactive warehouse', 400);

    // ── Validate supplier (required for return_to_supplier) ────────────────
    let supplier = null;
    if (returnType === 'return_to_supplier') {
      if (!supplierId) throw new AppError('Supplier is required for return to supplier', 400);
      supplier = await Supplier.findById(supplierId);
      if (!supplier) throw new AppError('Supplier not found', 404);
      if (!supplier.isActive) throw new AppError('Cannot return to inactive supplier', 400);
    }

    // ── Validate reference document (required for internal_return) ─────────
    let referenceDoc = null;
    let referenceDisplay = '';

    if (returnType === 'internal_return') {
      if (!referenceType) throw new AppError('Reference type is required for internal return', 400);
      if (!referenceId) throw new AppError('Reference document ID is required for internal return', 400);

      const validRefTypes = Object.keys(REFERENCE_MODEL_MAP);
      if (!validRefTypes.includes(referenceType)) {
        throw new AppError(
          `Reference type "${referenceType}" is not supported yet. Supported types: ${validRefTypes.join(', ')}`,
          400
        );
      }

      const ReferenceModel = REFERENCE_MODEL_MAP[referenceType];
      referenceDoc = await ReferenceModel.findById(referenceId);
      if (!referenceDoc) {
        throw new AppError(`${referenceType} document not found: ${referenceId}`, 404);
      }

      // Build a display string for the reason field
      const numberField = referenceType === 'Transfer' ? 'transferNumber' : 'number';
      referenceDisplay = referenceDoc[numberField] || referenceDoc._id.toString();
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

      // For supplier returns, verify available quantity is sufficient
      if (returnType === 'return_to_supplier') {
        if (batch.status !== 'active') {
          throw new AppError(`Item ${index + 1}: Batch is not active (status: ${batch.status})`, 400);
        }
        if (batch.availableQuantity < item.quantity) {
          throw new AppError(`Item ${index + 1}: Insufficient available quantity. Requested: ${item.quantity}, Available: ${batch.availableQuantity}`, 400);
        }
      }

      // Capture the batch's unitCost
      batchMap[item.batch] = batch.unitCost || 0;
    }

    // ── Generate return number ────────────────────────────────────────────
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Return.countDocuments();
    const returnNumber = `RET-${datePart}-${String(count + 1).padStart(4, '0')}`;

    // ── Execute all operations atomically ──────────────────────────────────
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // ── Build the return document data ──────────────────────────────────
      const returnDocData = {
        returnNumber,
        returnType,
        warehouse: warehouseId,
        supplier: supplierId || null,
        returnDate: returnDate || new Date(),
        status: 'completed',
        reason,
        notes,
        createdBy,
        items: [], // items added below
      };

      // Include reference for internal returns (audit trail)
      if (returnType === 'internal_return') {
        returnDocData.referenceType = referenceType;
        returnDocData.referenceId = referenceId;
      }

      // ── Create the Return document ──────────────────────────────────────
      const returnDoc = await returnRepository.create(returnDocData, session);

      // ── Process each item ─────────────────────────────────────────────
      const processedItems = [];
      const transactionType = returnType === 'return_to_supplier' ? 'return_to_supplier' : 'return';

      for (const item of items) {
        const { product: productId, batch: batchId, quantity } = item;
        const effectiveUnitCost = batchMap[batchId] || 0;

        // ── Build reason with reference document info ──────────────────────
        let transactionReason;
        if (returnType === 'return_to_supplier') {
          transactionReason = `Return to ${supplier ? supplier.name : 'Supplier'}`;
        } else {
          transactionReason = `Return from ${referenceType} ${referenceDisplay}`;
        }

        // ── Create inventory transaction ─────────────────────────────────
        const transactionData = {
          batch: batchId,
          product: productId,
          warehouse: warehouseId,
          transactionType,
          quantity,
          unitCost: effectiveUnitCost,
          referenceType: 'Return',
          referenceId: returnDoc._id,
          reason: transactionReason,
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

      // ── Update the Return document with processed items ─────────────────
      returnDoc.items = processedItems;
      await returnDoc.save({ session });

      await session.commitTransaction();

      return returnRepository.findById(returnDoc._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  /**
   * Lists return documents with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.returnType) filter.returnType = query.returnType;
    if (query.status) filter.status = query.status;
    if (query.referenceType) filter.referenceType = query.referenceType;
    if (query.referenceId) filter.referenceId = query.referenceId;
    if (query.search) {
      filter.returnNumber = { $regex: query.search, $options: 'i' };
    }
    if (query.startDate || query.endDate) {
      filter.returnDate = {};
      if (query.startDate) filter.returnDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.returnDate.$lte = new Date(query.endDate);
    }

    return returnRepository.findAll(filter);
  },

  /**
   * Gets a single return document by ID.
   */
  async getById(id) {
    const returnDoc = await returnRepository.findById(id);
    if (!returnDoc) throw new AppError('Return document not found', 404);
    return returnDoc;
  },
};

module.exports = returnService;
