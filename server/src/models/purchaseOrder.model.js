const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0, default: 0 },
    receivedQuantity: { type: Number, default: 0, min: 0 },
    remainingQuantity: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    purchaseRequest: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseRequest", default: null },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    status: {
      type: String,
      enum: ["draft","submitted","approved","rejected","partially_received","fully_received","cancelled"],
      default: "draft",
    },
    subtotal: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    items: {
      type: [purchaseOrderItemSchema],
      required: true,
      validate: { validator: (items) => items.length > 0, message: "Purchase order must have at least one item" },
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

purchaseOrderSchema.index({ supplier: 1, orderDate: -1 });
purchaseOrderSchema.index({ warehouse: 1, orderDate: -1 });
purchaseOrderSchema.index({ status: 1, orderDate: -1 });
purchaseOrderSchema.index({ createdBy: 1, orderDate: -1 });
purchaseOrderSchema.index({ purchaseRequest: 1 }, { sparse: true });
purchaseOrderSchema.index({ deletedAt: 1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
