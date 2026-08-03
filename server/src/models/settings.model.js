const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      required: true,
      trim: true,
      default: 'نظام عمليات المطاعم العسكرية (MessOps)',
    },
    unitCode: {
      type: String,
      required: true,
      trim: true,
      default: 'SEC-MIL-HQ-01',
    },
    language: {
      type: String,
      required: true,
      enum: ['ar', 'en'],
      default: 'ar',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
