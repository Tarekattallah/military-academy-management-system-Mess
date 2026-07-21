const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
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
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    lotNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    manufacturingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    initialQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    status: {
      type: String,
      enum: ['active', 'depleted', 'expired', 'quarantined', 'archived'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// Prevent duplicate batch numbers for the same product & warehouse
batchSchema.index({ product: 1, warehouse: 1, batchNumber: 1 }, { unique: true });
// Fast lookup by product + warehouse
batchSchema.index({ product: 1, warehouse: 1 });
// Filter by warehouse + status (dashboard queries)
batchSchema.index({ warehouse: 1, status: 1 });
// Query batches nearing/future expiry
batchSchema.index({ expiryDate: 1 });
// Filter by status across all warehouses
batchSchema.index({ status: 1 });

module.exports = mongoose.model('Batch', batchSchema);
