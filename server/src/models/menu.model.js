const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    plannedServings: {
      type: Number,
      required: true,
      min: 1,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    menuNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    menuDate: {
      type: Date,
      required: true,
    },
    mealType: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'dinner'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
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
      type: [menuItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Menu must have at least one recipe',
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
menuSchema.index({ menuDate: 1, mealType: 1 }, { unique: true });
menuSchema.index({ status: 1, menuDate: -1 });
menuSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Menu', menuSchema);
