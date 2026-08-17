const productRepository = require('../repositories/product.repository');
const Category = require('../models/category.model');
const Unit = require('../models/unit.model');
const Supplier = require('../models/supplier.model');
const AppError = require('../utils/AppError');

const productService = {
  async list() {
    return productRepository.findAll({ isActive: true });
  },

  async listAll() {
    return productRepository.findAll();
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  },

  async create({ name, description, category, unit, unitPrice, taxRate, supplier, minStockLevel, maxStockLevel, sku, barcode, isActive }) {
    const trimmed = name.trim();

    const existing = await productRepository.findByName(trimmed);
    if (existing) throw new AppError('Product already exists', 409);

    if (sku) {
      const trimmedSku = sku.trim().toUpperCase();
      const existingSku = await productRepository.findBySku(trimmedSku);
      if (existingSku) throw new AppError('SKU already in use', 409);
    }

    if (barcode) {
      const existingBarcode = await productRepository.findByBarcode(barcode.trim());
      if (existingBarcode) throw new AppError('Barcode already in use', 409);
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) throw new AppError('Category not found', 404);
    if (!categoryDoc.isActive) throw new AppError('Category is inactive', 400);

    const unitDoc = await Unit.findById(unit);
    if (!unitDoc) throw new AppError('Unit not found', 404);
    if (!unitDoc.isActive) throw new AppError('Unit is inactive', 400);

    if (supplier) {
      const supplierDoc = await Supplier.findById(supplier);
      if (!supplierDoc) throw new AppError('Supplier not found', 404);
      if (!supplierDoc.isActive) throw new AppError('Supplier is inactive', 400);
    }

    return productRepository.create({
      name: trimmed,
      description,
      category,
      unit,
      unitPrice,
      taxRate,
      supplier,
      minStockLevel,
      maxStockLevel,
      sku: sku ? sku.trim().toUpperCase() : undefined,
      barcode: barcode ? barcode.trim() : undefined,
      isActive,
    });
  },

  async update(id, data) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    if (data.name) {
      const trimmed = data.name.trim();
      const existing = await productRepository.findByName(trimmed);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Product name already in use', 409);
      }
      data.name = trimmed;
    }

    if (data.sku) {
      const trimmedSku = data.sku.trim().toUpperCase();
      const existingSku = await productRepository.findBySku(trimmedSku);
      if (existingSku && existingSku._id.toString() !== id) {
        throw new AppError('SKU already in use', 409);
      }
      data.sku = trimmedSku;
    }

    if (data.barcode) {
      const trimmedBarcode = data.barcode.trim();
      const existingBarcode = await productRepository.findByBarcode(trimmedBarcode);
      if (existingBarcode && existingBarcode._id.toString() !== id) {
        throw new AppError('Barcode already in use', 409);
      }
      data.barcode = trimmedBarcode;
    }

    if (data.category) {
      const categoryDoc = await Category.findById(data.category);
      if (!categoryDoc) throw new AppError('Category not found', 404);
      if (!categoryDoc.isActive) throw new AppError('Category is inactive', 400);
    }

    if (data.unit) {
      const unitDoc = await Unit.findById(data.unit);
      if (!unitDoc) throw new AppError('Unit not found', 404);
      if (!unitDoc.isActive) throw new AppError('Unit is inactive', 400);
    }

    if (data.supplier) {
      const supplierDoc = await Supplier.findById(data.supplier);
      if (!supplierDoc) throw new AppError('Supplier not found', 404);
      if (!supplierDoc.isActive) throw new AppError('Supplier is inactive', 400);
    }

    // supplier can be explicitly set to null to remove the reference
    if (data.supplier === null) {
      data.supplier = null;
    }

    const updated = await productRepository.updateById(id, data);
    if (!updated) throw new AppError('Product not found', 404);

    // If unitPrice changed, recalculate standardCost for recipes using this product
    if (data.unitPrice !== undefined && data.unitPrice !== product.unitPrice) {
      const recipeService = require('./recipe.service');
      // Fire and forget (or await if we want to ensure it completes before returning)
      await recipeService.recalculateCostsForProduct(id).catch(err => {
        console.error(`Failed to recalculate recipe costs for product ${id}:`, err);
      });
    }

    return updated;
  },

  async remove(id) {
    const product = await productRepository.deleteById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  },
};

module.exports = productService;
