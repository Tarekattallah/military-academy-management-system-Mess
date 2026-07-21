const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    taxRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    minStockLevel: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxStockLevel: {
      type: Number,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ isActive: 1 });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Product', productSchema);
