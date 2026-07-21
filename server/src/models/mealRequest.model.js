const mongoose = require('mongoose');

const mealRequestItemSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    requestedServings: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const mealRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    requestDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    requestingUnit: {
      type: String,
      required: true,
      trim: true,
    },
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'completed'],
      default: 'draft',
    },
    notes: {
      type: String,
      trim: true,
    },
    requestedBy: {
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
      type: [mealRequestItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Meal request must have at least one item',
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// requestNumber is already indexed via unique: true in the schema definition
mealRequestSchema.index({ menu: 1, status: 1 });
mealRequestSchema.index({ requestingUnit: 1, requestDate: -1 });
mealRequestSchema.index({ status: 1 });

module.exports = mongoose.model('MealRequest', mealRequestSchema);
