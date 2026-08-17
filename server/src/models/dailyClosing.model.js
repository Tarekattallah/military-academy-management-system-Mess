const mongoose = require('mongoose');

// Snapshot schema for opening and closing balances
const stockSnapshotSchema = new mongoose.Schema(
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
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const dailyClosingSchema = new mongoose.Schema(
  {
    logicalDate: {
      type: Date,
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'RECONCILING', 'PENDING_APPROVAL', 'CLOSED'],
      default: 'OPEN',
      required: true,
    },
    
    // Timestamps for status transitions
    openedAt: { type: Date, default: Date.now },
    reconciledAt: { type: Date },
    submittedAt: { type: Date },
    closedAt: { type: Date },
    
    // Users associated with status transitions
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Stock Snapshots
    openingStockSnapshot: { type: [stockSnapshotSchema], default: [] },
    closingStockSnapshot: { type: [stockSnapshotSchema], default: [] },

    // Summaries
    inventorySummary: {
      totalReceiving: { type: Number, default: 0 },
      totalIssue: { type: Number, default: 0 },
      totalWaste: { type: Number, default: 0 },
      totalReturn: { type: Number, default: 0 },
      totalAdjustment: { type: Number, default: 0 },
      totalTransferIn: { type: Number, default: 0 },
      totalTransferOut: { type: Number, default: 0 },
    },

    mealSummary: {
      plannedMeals: { type: Number, default: 0 },
      actualMeals: { type: Number, default: 0 },
      executionRate: { type: Number, default: 0 }, // actual / planned percentage
    },

    costSummary: {
      totalStandardCost: { type: Number, default: 0 },
      totalActualCost: { type: Number, default: 0 },
      totalWasteCost: { type: Number, default: 0 },
      operationalCost: { type: Number, default: 0 },
      varianceAmount: { type: Number, default: 0 },
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// A warehouse can only have one closing record per logical date
dailyClosingSchema.index({ logicalDate: 1, warehouse: 1 }, { unique: true });
dailyClosingSchema.index({ status: 1 });

module.exports = mongoose.model('DailyClosing', dailyClosingSchema);
