const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    paymentTerms: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    leadTimeDays: {
      type: Number,
      min: 0,
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

supplierSchema.index({ isActive: 1 });
supplierSchema.index({ code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Supplier', supplierSchema);
