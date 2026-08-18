const mongoose = require('mongoose');

const receivingItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batchNumber: {
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
    manufacturingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
  },
  { _id: false }
);

const receivingSchema = new mongoose.Schema(
  {
    receivingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    receivingDate: {
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
      type: [receivingItemSchema],
      required: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// Note: receivingNumber already has an index via unique: true
receivingSchema.index({ supplier: 1, receivingDate: -1 });
receivingSchema.index({ warehouse: 1, receivingDate: -1 });
receivingSchema.index({ status: 1, receivingDate: -1 });
receivingSchema.index({ createdBy: 1, receivingDate: -1 });

module.exports = mongoose.model('Receiving', receivingSchema);
