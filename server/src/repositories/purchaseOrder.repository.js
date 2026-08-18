const PurchaseOrder = require("../models/purchaseOrder.model");

const purchaseOrderRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return PurchaseOrder.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return PurchaseOrder.findById(id)
      .populate("supplier", "name code phone email")
      .populate("warehouse", "name code")
      .populate("purchaseRequest", "requestNumber status")
      .populate("createdBy", "displayName username")
      .populate("approvedBy", "displayName username")
      .populate("rejectedBy", "displayName username")
      .populate("updatedBy", "displayName username")
      .populate("items.product", "name sku")
      .populate("items.unit", "name abbreviation");
  },

  findAll(filter = {}) {
    return PurchaseOrder.find({ ...filter, deletedAt: null })
      .populate("supplier", "name code")
      .populate("warehouse", "name code")
      .populate("purchaseRequest", "requestNumber status")
      .populate("createdBy", "displayName username")
      .populate("items.product", "name sku")
      .populate("items.unit", "name abbreviation")
      .sort({ orderDate: -1 });
  },

  updateById(id, updates, session) {
    const options = { new: true, runValidators: true, ...(session ? { session } : {}) };
    return PurchaseOrder.findByIdAndUpdate(id, updates, options)
      .populate("supplier", "name code")
      .populate("warehouse", "name code")
      .populate("purchaseRequest", "requestNumber status")
      .populate("createdBy", "displayName username")
      .populate("approvedBy", "displayName username")
      .populate("rejectedBy", "displayName username")
      .populate("items.product", "name sku")
      .populate("items.unit", "name abbreviation");
  },

  existsByOrderNumber(orderNumber) {
    return PurchaseOrder.exists({ orderNumber });
  },

  countAll() {
    return PurchaseOrder.countDocuments();
  },
};

module.exports = purchaseOrderRepository;
