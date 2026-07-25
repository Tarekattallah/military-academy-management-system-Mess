const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
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
    transactionType: {
      type: String,
      required: true,
      enum: [
        'receiving',
        'transfer_out',
        'transfer_in',
        'return',
        'return_to_supplier',
        'waste',
        'adjustment',
        'issue',
        'reservation',
        'reservation_cancel',
        'cancellation',
      ],
    },
    module: {
      type: String,
      required: true,
      enum: [
        'receiving',
        'transfers',
        'returns',
        'waste',
        'stock-count',
        'meal-issue',
        'manual',
      ],
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    referenceType: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reason: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// Fast lookup by batch (all transactions for a batch)
inventoryTransactionSchema.index({ batch: 1, transactionDate: -1 });
// Lookup by product (all transactions for a product)
inventoryTransactionSchema.index({ product: 1, transactionDate: -1 });
// Lookup by warehouse (all transactions for a warehouse)
inventoryTransactionSchema.index({ warehouse: 1, transactionDate: -1 });
// Lookup by reference document (e.g., all transactions for a Receiving)
inventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });
// Filter by transaction type
inventoryTransactionSchema.index({ transactionType: 1, transactionDate: -1 });
// Filter by module (audit queries)
inventoryTransactionSchema.index({ module: 1, transactionDate: -1 });
// Date range queries
inventoryTransactionSchema.index({ transactionDate: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
