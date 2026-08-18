const mongoose = require("mongoose");

const purchaseRequestItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true, trim: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestDate: { type: Date, default: Date.now },
    requiredDate: { type: Date },
    reason: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["draft","submitted","approved","rejected","cancelled"], default: "draft" },
    items: {
      type: [purchaseRequestItemSchema],
      required: true,
      validate: { validator: (items) => items.length > 0, message: "Purchase request must have at least one item" },
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

purchaseRequestSchema.index({ warehouse: 1, requestDate: -1 });
purchaseRequestSchema.index({ status: 1, requestDate: -1 });
purchaseRequestSchema.index({ requestedBy: 1, requestDate: -1 });
purchaseRequestSchema.index({ deletedAt: 1 });

module.exports = mongoose.model("PurchaseRequest", purchaseRequestSchema);
