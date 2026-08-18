const purchaseOrderService = require("../services/purchaseOrder.service");
const catchAsync = require("../utils/catchAsync");

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const po = await purchaseOrderService.create(data);
  res.status(201).json({ success: true, data: po });
});

const getById = catchAsync(async (req, res) => {
  const po = await purchaseOrderService.getById(req.params.id);
  res.status(200).json({ success: true, data: po });
});

const list = catchAsync(async (req, res) => {
  const pos = await purchaseOrderService.list(req.query);
  res.status(200).json({ success: true, data: pos });
});

const update = catchAsync(async (req, res) => {
  const po = await purchaseOrderService.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, data: po });
});

const remove = catchAsync(async (req, res) => {
  await purchaseOrderService.delete(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: "Purchase order deleted successfully" });
});

const submit = catchAsync(async (req, res) => {
  const po = await purchaseOrderService.submit(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: po });
});

const approve = catchAsync(async (req, res) => {
  const po = await purchaseOrderService.approve(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: po });
});

const reject = catchAsync(async (req, res) => {
  const po = await purchaseOrderService.reject(req.params.id, req.user.id, req.body.reason);
  res.status(200).json({ success: true, data: po });
});

const cancel = catchAsync(async (req, res) => {
  const po = await purchaseOrderService.cancel(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: po });
});

module.exports = { create, getById, list, update, remove, submit, approve, reject, cancel };
