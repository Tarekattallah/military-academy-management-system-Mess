const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    abbreviation: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['weight', 'volume', 'quantity', 'length', 'other'],
    },
    description: {
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

unitSchema.index({ isActive: 1 });
unitSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Unit', unitSchema);
