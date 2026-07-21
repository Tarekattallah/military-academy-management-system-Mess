const mongoose = require('mongoose');

// ── Snapshot schemas (immutable after creation) ──────────────────────────

const ingredientSnapshotSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
    },
    unitName: { type: String, required: true },
  },
  { _id: false }
);

const recipeSnapshotSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
    },
    recipeName: { type: String, required: true },
    recipeNumber: { type: String, required: true },
    recipeYield: { type: Number, required: true, min: 1 },
    ingredients: { type: [ingredientSnapshotSchema], required: true },
  },
  { _id: false }
);

// ── Distribution item schema ─────────────────────────────────────────────

const distributionItemSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
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
    plannedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    actualQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    wastageQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    inventoryTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryTransaction',
    },
  },
  { _id: false }
);

// ── Main schema ──────────────────────────────────────────────────────────

const mealDistributionSchema = new mongoose.Schema(
  {
    distributionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
    },
    mealRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealRequest',
      required: true,
    },
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
    },
    requestingUnit: {
      type: String,
      trim: true,
    },
    distributionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'cancelled'],
      default: 'draft',
    },
    distributedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    // ── Immutable snapshots ──────────────────────────────────────────────
    recipeSnapshots: {
      type: [recipeSnapshotSchema],
      required: true,
      validate: {
        validator: (snapshots) => snapshots.length > 0,
        message: 'Must have at least one recipe snapshot',
      },
    },
    // ── Distribution items (references the reserved batches) ─────────────
    items: {
      type: [distributionItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Must have at least one distribution item',
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// distributionNumber is already indexed via unique: true in the schema definition
mealDistributionSchema.index({ reservation: 1 });
mealDistributionSchema.index({ reservation: 1, status: 1 });
mealDistributionSchema.index({ mealRequest: 1 });
mealDistributionSchema.index({ status: 1 });
mealDistributionSchema.index({ distributionDate: -1 });

module.exports = mongoose.model('MealDistribution', mealDistributionSchema);
