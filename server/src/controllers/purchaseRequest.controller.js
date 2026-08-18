const purchaseRequestService = require("../services/purchaseRequest.service");
const catchAsync = require("../utils/catchAsync");

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const pr = await purchaseRequestService.create(data);
  res.status(201).json({ success: true, data: pr });
});

const getById = catchAsync(async (req, res) => {
  const pr = await purchaseRequestService.getById(req.params.id);
  res.status(200).json({ success: true, data: pr });
});

const list = catchAsync(async (req, res) => {
  const prs = await purchaseRequestService.list(req.query);
  res.status(200).json({ success: true, data: prs });
});

const update = catchAsync(async (req, res) => {
  const pr = await purchaseRequestService.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, data: pr });
});

const remove = catchAsync(async (req, res) => {
  await purchaseRequestService.delete(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: "Purchase request deleted successfully" });
});

const submit = catchAsync(async (req, res) => {
  const pr = await purchaseRequestService.submit(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: "Purchase request submitted", data: pr });
});

const approve = catchAsync(async (req, res) => {
  const pr = await purchaseRequestService.approve(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: "Purchase request approved", data: pr });
});

const reject = catchAsync(async (req, res) => {
  const pr = await purchaseRequestService.reject(req.params.id, req.user.id, req.body.reason);
  res.status(200).json({ success: true, message: "Purchase request rejected", data: pr });
});

const cancel = catchAsync(async (req, res) => {
  const pr = await purchaseRequestService.cancel(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: "Purchase request cancelled", data: pr });
});

module.exports = { create, getById, list, update, remove, submit, approve, reject, cancel };
