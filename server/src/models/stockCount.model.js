const mongoose = require('mongoose');

const stockCountItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    systemQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    physicalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    difference: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const stockCountSchema = new mongoose.Schema(
  {
    countNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    countDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'approved'],
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
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    items: {
      type: [stockCountItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Stock count must have at least one item',
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
stockCountSchema.index({ warehouse: 1, countDate: -1 });
stockCountSchema.index({ status: 1, countDate: -1 });
stockCountSchema.index({ createdBy: 1, countDate: -1 });

module.exports = mongoose.model('StockCount', stockCountSchema);
