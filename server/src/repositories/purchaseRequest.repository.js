const PurchaseRequest = require("../models/purchaseRequest.model");

const purchaseRequestRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return PurchaseRequest.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return PurchaseRequest.findById(id)
      .populate("warehouse", "name code")
      .populate("requestedBy", "displayName username")
      .populate("createdBy", "displayName username")
      .populate("approvedBy", "displayName username")
      .populate("rejectedBy", "displayName username")
      .populate("updatedBy", "displayName username")
      .populate("items.product", "name sku")
      .populate("items.unit", "name abbreviation");
  },

  findAll(filter = {}) {
    return PurchaseRequest.find({ ...filter, deletedAt: null })
      .populate("warehouse", "name code")
      .populate("requestedBy", "displayName username")
      .populate("createdBy", "displayName username")
      .populate("items.product", "name sku")
      .populate("items.unit", "name abbreviation")
      .sort({ requestDate: -1 });
  },

  updateById(id, updates, session) {
    const options = { new: true, runValidators: true, ...(session ? { session } : {}) };
    return PurchaseRequest.findByIdAndUpdate(id, updates, options)
      .populate("warehouse", "name code")
      .populate("requestedBy", "displayName username")
      .populate("createdBy", "displayName username")
      .populate("approvedBy", "displayName username")
      .populate("rejectedBy", "displayName username")
      .populate("items.product", "name sku")
      .populate("items.unit", "name abbreviation");
  },

  existsByRequestNumber(requestNumber) {
    return PurchaseRequest.exists({ requestNumber });
  },

  countAll() {
    return PurchaseRequest.countDocuments();
  },
};

module.exports = purchaseRequestRepository;
