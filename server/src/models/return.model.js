const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
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

const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    returnType: {
      type: String,
      required: true,
      enum: ['return_to_supplier', 'internal_return'],
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    referenceType: {
      type: String,
      trim: true,
      enum: ['Transfer'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    returnDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'draft',
    },
    reason: {
      type: String,
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
    items: {
      type: [returnItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Return must have at least one item',
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// Note: returnNumber already has an index via unique: true
returnSchema.index({ warehouse: 1, returnDate: -1 });
returnSchema.index({ returnType: 1, returnDate: -1 });
returnSchema.index({ status: 1, returnDate: -1 });
returnSchema.index({ createdBy: 1, returnDate: -1 });
returnSchema.index({ supplier: 1, returnDate: -1 });
returnSchema.index({ referenceType: 1, referenceId: 1 });

module.exports = mongoose.model('Return', returnSchema);
