const purchaseRequestRepository = require("../repositories/purchaseRequest.repository");
const PurchaseRequest = require("../models/purchaseRequest.model");
const Warehouse = require("../models/warehouse.model");
const Product = require("../models/product.model");
const Unit = require("../models/unit.model");
const AppError = require("../utils/AppError");

// Statuses that prevent free editing
const IMMUTABLE_STATUSES = ["approved", "rejected", "cancelled"];
const EDITABLE_STATUSES = ["draft"];

const purchaseRequestService = {
  /**
   * Creates a new PurchaseRequest in DRAFT status.
   * Does NOT touch inventory.
   */
  async create(data) {
    const { warehouse: warehouseId, requestedBy, requestDate, requiredDate, reason, notes, createdBy, items } = data;

    // Validate warehouse
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError("Warehouse not found", 404);
    if (!warehouse.isActive) throw new AppError("Cannot create purchase request for inactive warehouse", 400);

    // Validate all products and units exist and are active
    const productIds = [...new Set(items.map((item) => item.product))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    for (const p of products) {
      if (!p.isActive) throw new AppError(`Product "${p.name}" is inactive`, 400);
      productMap[p._id.toString()] = p;
    }
    for (const pid of productIds) {
      if (!productMap[pid]) throw new AppError(`Product ${pid} not found`, 404);
    }

    const unitIds = [...new Set(items.map((item) => item.unit))];
    const units = await Unit.find({ _id: { $in: unitIds } });
    const unitMap = {};
    for (const u of units) {
      if (!u.isActive) throw new AppError(`Unit "${u.name}" is inactive`, 400);
      unitMap[u._id.toString()] = u;
    }
    for (const uid of unitIds) {
      if (!unitMap[uid]) throw new AppError(`Unit ${uid} not found`, 404);
    }

    // Validate item quantities
    for (const [index, item] of items.entries()) {
      if (item.quantity <= 0) {
        throw new AppError(`Item ${index + 1}: Quantity must be positive`, 400);
      }
    }

    // Generate request number PR-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await PurchaseRequest.countDocuments();
    const requestNumber = `PR-${datePart}-${String(count + 1).padStart(4, "0")}`;

    const pr = await purchaseRequestRepository.create({
      requestNumber,
      warehouse: warehouseId,
      requestedBy: requestedBy || createdBy,
      requestDate: requestDate || new Date(),
      requiredDate: requiredDate || undefined,
      reason,
      notes,
      status: "draft",
      items,
      createdBy,
    });

    return purchaseRequestRepository.findById(pr._id);
  },

  async getById(id) {
    const pr = await purchaseRequestRepository.findById(id);
    if (!pr || pr.deletedAt) throw new AppError("Purchase request not found", 404);
    return pr;
  },

  async list(query = {}) {
    const filter = {};
    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.status) filter.status = query.status;
    if (query.requestedBy) filter.requestedBy = query.requestedBy;
    if (query.search) filter.requestNumber = { $regex: query.search, $options: "i" };
    if (query.startDate || query.endDate) {
      filter.requestDate = {};
      if (query.startDate) filter.requestDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.requestDate.$lte = new Date(query.endDate);
    }
    return purchaseRequestRepository.findAll(filter);
  },

  /**
   * Update a PurchaseRequest. Only DRAFT may be freely edited.
   */
  async update(id, data, performedBy) {
    const pr = await purchaseRequestRepository.findById(id);
    if (!pr || pr.deletedAt) throw new AppError("Purchase request not found", 404);

    if (!EDITABLE_STATUSES.includes(pr.status)) {
      throw new AppError(
        `Cannot edit a purchase request with status "${pr.status}". Only DRAFT requests can be freely modified.`,
        400
      );
    }

    // Prevent changing immutable fields
    const forbidden = ["requestNumber", "createdBy", "approvedBy", "approvedAt", "rejectedBy", "rejectedAt", "status"];
    for (const key of forbidden) {
      if (key in data) {
        throw new AppError(`Field "${key}" cannot be changed directly.`, 400);
      }
    }

    // Re-validate items if they are being updated
    if (data.items) {
      for (const [index, item] of data.items.entries()) {
        if (item.quantity <= 0) throw new AppError(`Item ${index + 1}: Quantity must be positive`, 400);
        const product = await Product.findById(item.product);
        if (!product || !product.isActive) throw new AppError(`Item ${index + 1}: Invalid or inactive product`, 400);
        const unit = await Unit.findById(item.unit);
        if (!unit || !unit.isActive) throw new AppError(`Item ${index + 1}: Invalid or inactive unit`, 400);
      }
    }

    return purchaseRequestRepository.updateById(id, { ...data, updatedBy: performedBy });
  },

  /**
   * Soft delete — only DRAFT or CANCELLED may be deleted.
   */
  async delete(id, performedBy) {
    const pr = await purchaseRequestRepository.findById(id);
    if (!pr || pr.deletedAt) throw new AppError("Purchase request not found", 404);

    if (IMMUTABLE_STATUSES.filter(s => s !== "cancelled").includes(pr.status)) {
      throw new AppError(
        `Cannot delete a purchase request with status "${pr.status}".`,
        400
      );
    }

    return purchaseRequestRepository.updateById(id, {
      deletedAt: new Date(),
      deletedBy: performedBy,
    });
  },

  /**
   * Submit a DRAFT PurchaseRequest.
   */
  async submit(id, performedBy) {
    const pr = await purchaseRequestRepository.findById(id);
    if (!pr || pr.deletedAt) throw new AppError("Purchase request not found", 404);
    if (pr.status !== "draft") throw new AppError(`Cannot submit a purchase request with status "${pr.status}".`, 400);

    return purchaseRequestRepository.updateById(id, {
      status: "submitted",
      updatedBy: performedBy,
    });
  },

  /**
   * Approve a SUBMITTED PurchaseRequest.
   */
  async approve(id, performedBy) {
    const pr = await purchaseRequestRepository.findById(id);
    if (!pr || pr.deletedAt) throw new AppError("Purchase request not found", 404);
    if (pr.status !== "submitted") throw new AppError(`Cannot approve a purchase request with status "${pr.status}".`, 400);

    return purchaseRequestRepository.updateById(id, {
      status: "approved",
      approvedBy: performedBy,
      approvedAt: new Date(),
      updatedBy: performedBy,
    });
  },

  /**
   * Reject a SUBMITTED PurchaseRequest.
   */
  async reject(id, performedBy, reason) {
    const pr = await purchaseRequestRepository.findById(id);
    if (!pr || pr.deletedAt) throw new AppError("Purchase request not found", 404);
    if (pr.status !== "submitted") throw new AppError(`Cannot reject a purchase request with status "${pr.status}".`, 400);

    return purchaseRequestRepository.updateById(id, {
      status: "rejected",
      rejectedBy: performedBy,
      rejectedAt: new Date(),
      rejectionReason: reason || undefined,
      updatedBy: performedBy,
    });
  },

  /**
   * Cancel a DRAFT or SUBMITTED PurchaseRequest.
   * Does NOT allow cancelling APPROVED requests to prevent breaking PurchaseOrders.
   */
  async cancel(id, performedBy) {
    const pr = await purchaseRequestRepository.findById(id);
    if (!pr || pr.deletedAt) throw new AppError("Purchase request not found", 404);
    if (!["draft", "submitted"].includes(pr.status)) {
      throw new AppError(`Cannot cancel a purchase request with status "${pr.status}".`, 400);
    }

    return purchaseRequestRepository.updateById(id, {
      status: "cancelled",
      updatedBy: performedBy,
    });
  }
};

module.exports = purchaseRequestService;
