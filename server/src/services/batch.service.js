const batchRepository = require('../repositories/batch.repository');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const Supplier = require('../models/supplier.model');
const AppError = require('../utils/AppError');

const batchService = {
  async list(query = {}) {
    const filter = {};

    if (query.product) filter.product = query.product;
    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.batchNumber = { $regex: query.search, $options: 'i' };
    }

    return batchRepository.findAll(filter);
  },

  async getById(id) {
    const batch = await batchRepository.findById(id);
    if (!batch) throw new AppError('Batch not found', 404);
    return batch;
  },

  async create(data) {
    const { product: productId, warehouse: warehouseId, batchNumber, supplier: supplierId, initialQuantity, manufacturingDate, expiryDate } = data;

    const trimmedBatchNumber = batchNumber.trim().toUpperCase();

    // ── Validate Product exists and is active ────────────────────────────
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);
    if (!product.isActive) throw new AppError('Cannot create batch for inactive product', 400);

    // ── Validate Warehouse exists and is active ─────────────────────────
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    if (!warehouse.isActive) throw new AppError('Cannot create batch for inactive warehouse', 400);

    // ── Validate Supplier if provided ───────────────────────────────────
    if (supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) throw new AppError('Supplier not found', 404);
      if (!supplier.isActive) throw new AppError('Cannot use inactive supplier', 400);
    }

    // ── Duplicate batch number for same product + warehouse ─────────────
    const existing = await batchRepository.findByIdentifier(productId, warehouseId, trimmedBatchNumber);
    if (existing) throw new AppError('Batch number already exists for this product and warehouse', 409);

    // ── Validate dates ──────────────────────────────────────────────────
    if (manufacturingDate && expiryDate && new Date(manufacturingDate) >= new Date(expiryDate)) {
      throw new AppError('Manufacturing date must be before expiry date', 400);
    }

    if (initialQuantity < 0) {
      throw new AppError('Initial quantity cannot be negative', 400);
    }

    return batchRepository.create({
      product: productId,
      warehouse: warehouseId,
      batchNumber: trimmedBatchNumber,
      lotNumber: data.lotNumber ? data.lotNumber.trim().toUpperCase() : undefined,
      manufacturingDate,
      expiryDate,
      initialQuantity,
      availableQuantity: initialQuantity,
      reservedQuantity: 0,
      unitCost: data.unitCost || 0,
      supplier: supplierId || undefined,
      notes: data.notes,
    });
  },

  async update(id, data) {
    const batch = await batchRepository.findById(id);
    if (!batch) throw new AppError('Batch not found', 404);

    // ── Protected fields (cannot be changed after creation) ─────────────
    const protectedFields = ['product', 'warehouse', 'batchNumber', 'initialQuantity', 'availableQuantity', 'reservedQuantity'];
    for (const field of protectedFields) {
      if (data[field] !== undefined && data[field] !== batch[field]) {
        throw new AppError(`Cannot change ${field} after batch creation`, 400);
      }
    }

    // ── Validate dates if provided ──────────────────────────────────────
    const mfgDate = data.manufacturingDate || batch.manufacturingDate;
    const expDate = data.expiryDate || batch.expiryDate;
    if (mfgDate && expDate && new Date(mfgDate) >= new Date(expDate)) {
      throw new AppError('Manufacturing date must be before expiry date', 400);
    }

    // ── Validate supplier if provided ───────────────────────────────────
    if (data.supplier) {
      const supplier = await Supplier.findById(data.supplier);
      if (!supplier) throw new AppError('Supplier not found', 404);
      if (!supplier.isActive) throw new AppError('Cannot use inactive supplier', 400);
    }

    // ── Validate status transitions ─────────────────────────────────────
    if (data.status && data.status !== batch.status) {
      const validTransitions = {
        active: ['depleted', 'expired', 'quarantined'],
        depleted: ['archived'],
        expired: ['archived'],
        quarantined: ['active', 'depleted', 'expired'],
        archived: [],
      };

      const allowed = validTransitions[batch.status] || [];
      if (!allowed.includes(data.status)) {
        throw new AppError(`Cannot transition from ${batch.status} to ${data.status}`, 400);
      }
    }

    return batchRepository.updateById(id, data);
  },

  async remove(id) {
    const batch = await batchRepository.findById(id);
    if (!batch) throw new AppError('Batch not found', 404);

    // ── Prevent deletion if inventory transactions have occurred ────────
    // If any quantity field has been modified, transactions happened
    if (batch.availableQuantity !== batch.initialQuantity || batch.reservedQuantity !== 0) {
      throw new AppError('Cannot delete batch with inventory transactions', 400);
    }

    return batchRepository.deleteById(id);
  },
};

module.exports = batchService;
