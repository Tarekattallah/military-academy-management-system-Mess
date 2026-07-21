const mongoose = require('mongoose');

const wasteItemSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const wasteSchema = new mongoose.Schema(
  {
    wasteNumber: {
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
    wasteDate: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
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
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'draft',
    },
    items: {
      type: [wasteItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Waste must have at least one item',
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// Note: wasteNumber already has an index via unique: true
wasteSchema.index({ warehouse: 1, wasteDate: -1 });
wasteSchema.index({ status: 1, wasteDate: -1 });
wasteSchema.index({ createdBy: 1, wasteDate: -1 });
wasteSchema.index({ reason: 1 });

module.exports = mongoose.model('Waste', wasteSchema);
