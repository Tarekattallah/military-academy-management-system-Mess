const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sourceBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    destinationBatchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const transferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    transferDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'draft',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [transferItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Transfer must have at least one item',
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// Note: transferNumber already has an index via unique: true
transferSchema.index({ sourceWarehouse: 1, transferDate: -1 });
transferSchema.index({ destinationWarehouse: 1, transferDate: -1 });
transferSchema.index({ status: 1, transferDate: -1 });
transferSchema.index({ createdBy: 1, transferDate: -1 });

module.exports = mongoose.model('Transfer', transferSchema);
