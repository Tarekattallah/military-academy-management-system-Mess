const mongoose = require('mongoose');

const currentStockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    batchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    weightedAverageCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastTransactionDate: {
      type: Date,
    },
    lastExpiryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// One record per product+warehouse
currentStockSchema.index({ product: 1, warehouse: 1 }, { unique: true });
// Fast lookup by warehouse (dashboard queries)
currentStockSchema.index({ warehouse: 1, availableQuantity: 1 });
// Fast lookup by product (availability checks)
currentStockSchema.index({ product: 1, availableQuantity: 1 });
// Low stock queries
currentStockSchema.index({ availableQuantity: 1 });
// Expiry tracking
currentStockSchema.index({ lastExpiryDate: 1 });

module.exports = mongoose.model('CurrentStock', currentStockSchema);
