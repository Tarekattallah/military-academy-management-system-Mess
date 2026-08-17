const mongoose = require('mongoose');

const reservationItemSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
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
    reservedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    consumedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    mealRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealRequest',
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    requestingUnit: {
      type: String,
      trim: true,
    },
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
    },
    operationalDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'reserved', 'released', 'consumed'],
      default: 'draft',
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reservedAt: {
      type: Date,
    },
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    releasedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    items: {
      type: [reservationItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Reservation must have at least one item',
      },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────
// reservationNumber is already indexed via unique: true in the schema definition
reservationSchema.index({ mealRequest: 1 });
reservationSchema.index({ mealRequest: 1, status: 1 });
reservationSchema.index({ warehouse: 1, status: 1 });
reservationSchema.index({ status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
