const purchaseOrderRepository = require("../repositories/purchaseOrder.repository");
const PurchaseOrder = require("../models/purchaseOrder.model");
const PurchaseRequest = require("../models/purchaseRequest.model");
const Supplier = require("../models/supplier.model");
const Warehouse = require("../models/warehouse.model");
const Product = require("../models/product.model");
const Unit = require("../models/unit.model");
const AppError = require("../utils/AppError");

const EDITABLE_STATUSES = ["draft"];

const purchaseOrderService = {
  async _validatePurchaseRequestAndItems(prId, items, currentPoId = null) {
    const productIds = [...new Set(items.map((item) => item.product.toString()))];
    if (productIds.length !== items.length) {
      throw new AppError("Purchase Order cannot contain duplicate products.", 400);
    }
    
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    for (const p of products) {
      if (!p.isActive) throw new AppError(`Product "${p.name}" is inactive`, 400);
      productMap[p._id.toString()] = p;
    }
    for (const pid of productIds) {
      if (!productMap[pid]) throw new AppError(`Product ${pid} not found`, 404);
    }

    const unitIds = [...new Set(items.map((item) => item.unit.toString()))];
    const units = await Unit.find({ _id: { $in: unitIds } });
    const unitMap = {};
    for (const u of units) {
      if (!u.isActive) throw new AppError(`Unit "${u.name}" is inactive`, 400);
      unitMap[u._id.toString()] = u;
    }
    for (const uid of unitIds) {
      if (!unitMap[uid]) throw new AppError(`Unit ${uid} not found`, 404);
    }

    for (const item of items) {
      const pid = item.product.toString();
      const p = productMap[pid];
      if (p.unit.toString() !== item.unit.toString()) {
        throw new AppError(`Unit is not valid for the specified product.`, 400);
      }
    }

    if (prId) {
      const pr = await PurchaseRequest.findById(prId);
      if (!pr || pr.deletedAt) throw new AppError("Referenced purchase request not found", 404);
      if (pr.status !== "approved") {
        throw new AppError("Purchase order can only reference an APPROVED purchase request", 400);
      }

      const query = {
        purchaseRequest: prId,
        deletedAt: null,
        status: { $nin: ["rejected", "cancelled"] }
      };
      if (currentPoId) {
        query._id = { $ne: currentPoId };
      }
      const duplicatePo = await PurchaseOrder.findOne(query);
      if (duplicatePo) {
        throw new AppError("Purchase Request has already been fully allocated to a Purchase Order.", 400);
      }

      if (items.length !== pr.items.length) {
        throw new AppError("Purchase Order must contain exactly the same number of items as the Purchase Request.", 400);
      }

      const prItemsMap = {};
      for (const prItem of pr.items) {
        prItemsMap[prItem.product.toString()] = prItem;
      }

      for (const item of items) {
        const pid = item.product.toString();
        const prItem = prItemsMap[pid];
        if (!prItem) {
          throw new AppError(`Product is not included in the approved Purchase Request.`, 400);
        }
        if (item.unit.toString() !== prItem.unit.toString()) {
          throw new AppError(`Unit is not valid for the specified product.`, 400);
        }
        if (item.quantity !== prItem.quantity) {
          throw new AppError(`Purchase Order quantity must exactly match the approved Purchase Request quantity.`, 400);
        }
      }
    }
  },

  /**
   * Creates a new PurchaseOrder in DRAFT status.
   * Does NOT touch inventory. Does NOT modify Batch, InventoryTransaction, or CurrentStock.
   */
  async create(data) {
    const {
      purchaseRequest: prId,
      supplier: supplierId,
      warehouse: warehouseId,
      orderDate,
      expectedDeliveryDate,
      notes,
      createdBy,
      items,
    } = data;

    // Validate supplier
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) throw new AppError("Supplier not found", 404);
    if (!supplier.isActive) throw new AppError("Cannot create purchase order for inactive supplier", 400);

    // Validate warehouse
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError("Warehouse not found", 404);
    if (!warehouse.isActive) throw new AppError("Cannot create purchase order for inactive warehouse", 400);

    await purchaseOrderService._validatePurchaseRequestAndItems(prId, items);

    // Validate items and compute server-side totals (never trust client)
    let subtotal = 0;
    const processedItems = [];
    for (const [index, item] of items.entries()) {
      if (item.quantity <= 0) throw new AppError(`Item ${index + 1}: Quantity must be positive`, 400);
      if (item.unitPrice < 0) throw new AppError(`Item ${index + 1}: Unit price cannot be negative`, 400);

      const totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
      subtotal += totalPrice;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice,          // always server-computed
        receivedQuantity: 0, // always starts at 0
        remainingQuantity: item.quantity, // always starts equal to ordered
        notes: item.notes || undefined,
      });
    }
    subtotal = Math.round(subtotal * 100) / 100;

    // Generate order number PO-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await PurchaseOrder.countDocuments();
    const orderNumber = `PO-${datePart}-${String(count + 1).padStart(4, "0")}`;

    const po = await purchaseOrderRepository.create({
      orderNumber,
      purchaseRequest: prId || null,
      supplier: supplierId,
      warehouse: warehouseId,
      orderDate: orderDate || new Date(),
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      status: "draft",
      subtotal,
      notes,
      items: processedItems,
      createdBy,
    });

    return purchaseOrderRepository.findById(po._id);
  },

  async getById(id) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po || po.deletedAt) throw new AppError("Purchase order not found", 404);
    return po;
  },

  async list(query = {}) {
    const filter = {};
    if (query.supplier) filter.supplier = query.supplier;
    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.status) filter.status = query.status;
    if (query.search) filter.orderNumber = { $regex: query.search, $options: "i" };
    if (query.startDate || query.endDate) {
      filter.orderDate = {};
      if (query.startDate) filter.orderDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.orderDate.$lte = new Date(query.endDate);
    }
    return purchaseOrderRepository.findAll(filter);
  },

  /**
   * Update a PurchaseOrder. Only DRAFT may be freely edited.
   * Never trusts client-provided totalPrice, receivedQuantity, or remainingQuantity.
   */
  async update(id, data, performedBy) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po || po.deletedAt) throw new AppError("Purchase order not found", 404);

    if (!EDITABLE_STATUSES.includes(po.status)) {
      throw new AppError(
        `Cannot edit a purchase order with status "${po.status}". Only DRAFT orders can be modified.`,
        400
      );
    }

    // Prevent changing immutable fields
    const forbidden = ["orderNumber", "createdBy", "approvedBy", "approvedAt", "rejectedBy", "rejectedAt", "status", "receivedQuantity", "remainingQuantity", "totalPrice"];
    for (const key of forbidden) {
      if (key in data) throw new AppError(`Field "${key}" cannot be changed directly.`, 400);
    }

    // Validate PR and Items if either is updated
    if (data.purchaseRequest !== undefined || data.items !== undefined) {
      const prIdToCheck = data.purchaseRequest !== undefined ? data.purchaseRequest : po.purchaseRequest;
      const itemsToCheck = data.items !== undefined ? data.items : po.items;
      await purchaseOrderService._validatePurchaseRequestAndItems(prIdToCheck, itemsToCheck, id);
    }

    // Re-compute item totals if items are updated
    if (data.items) {
      let subtotal = 0;
      const processedItems = [];
      for (const [index, item] of data.items.entries()) {
        if (item.quantity <= 0) throw new AppError(`Item ${index + 1}: Quantity must be positive`, 400);
        if (item.unitPrice < 0) throw new AppError(`Item ${index + 1}: Unit price cannot be negative`, 400);
        const totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
        subtotal += totalPrice;
        processedItems.push({
          product: item.product,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice,
          receivedQuantity: 0,
          remainingQuantity: item.quantity,
          notes: item.notes || undefined,
        });
      }
      data.items = processedItems;
      data.subtotal = Math.round(subtotal * 100) / 100;
    }

    return purchaseOrderRepository.updateById(id, { ...data, updatedBy: performedBy });
  },

  /**
   * Soft delete — only DRAFT orders may be deleted.
   */
  async delete(id, performedBy) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po || po.deletedAt) throw new AppError("Purchase order not found", 404);

    if (!EDITABLE_STATUSES.includes(po.status)) {
      throw new AppError(`Cannot delete a purchase order with status "${po.status}". Only DRAFT orders may be deleted.`, 400);
    }

    return purchaseOrderRepository.updateById(id, {
      deletedAt: new Date(),
      deletedBy: performedBy,
    });
  },

  async submit(id, performedBy) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po || po.deletedAt) throw new AppError("Purchase order not found", 404);

    if (po.status !== "draft") {
      throw new AppError(`Cannot submit a purchase order with status "${po.status}".`, 400);
    }

    return purchaseOrderRepository.updateById(id, {
      status: "submitted",
      updatedBy: performedBy,
    });
  },

  async approve(id, performedBy) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po || po.deletedAt) throw new AppError("Purchase order not found", 404);

    if (po.status !== "submitted") {
      throw new AppError(`Cannot approve a purchase order with status "${po.status}".`, 400);
    }

    return purchaseOrderRepository.updateById(id, {
      status: "approved",
      approvedBy: performedBy,
      approvedAt: new Date(),
      updatedBy: performedBy,
    });
  },

  async reject(id, performedBy, reason) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po || po.deletedAt) throw new AppError("Purchase order not found", 404);

    if (po.status !== "submitted") {
      throw new AppError(`Cannot reject a purchase order with status "${po.status}".`, 400);
    }

    return purchaseOrderRepository.updateById(id, {
      status: "rejected",
      rejectedBy: performedBy,
      rejectedAt: new Date(),
      rejectionReason: reason,
      updatedBy: performedBy,
    });
  },

  async cancel(id, performedBy) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po || po.deletedAt) throw new AppError("Purchase order not found", 404);

    const validStatuses = ["draft", "submitted", "approved"];
    if (!validStatuses.includes(po.status)) {
      throw new AppError(`Cannot cancel a purchase order with status "${po.status}".`, 400);
    }

    // Double check that there's no received quantity (especially for approved)
    // Even though 'approved' theoretically has 0 receivedQuantity, 
    // it's safer to check actual receiving fields.
    const hasReceiving = po.items.some(item => item.receivedQuantity > 0);
    if (hasReceiving) {
      throw new AppError("Cannot cancel a purchase order that has been partially or fully received.", 400);
    }

    return purchaseOrderRepository.updateById(id, {
      status: "cancelled",
      updatedBy: performedBy,
    });
  },
};

module.exports = purchaseOrderService;
