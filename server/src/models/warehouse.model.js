const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    location: {
      type: String,
      trim: true,
    },
    manager: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

warehouseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
