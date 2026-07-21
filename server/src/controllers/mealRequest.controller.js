const mealRequestService = require('../services/mealRequest.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, requestedBy: req.user.id };
  const request = await mealRequestService.create(data);
  res.status(201).json({ success: true, data: request });
});

const getById = catchAsync(async (req, res) => {
  const request = await mealRequestService.getById(req.params.id);
  res.status(200).json({ success: true, data: request });
});

const list = catchAsync(async (req, res) => {
  const requests = await mealRequestService.list(req.query);
  res.status(200).json({ success: true, data: requests });
});

const update = catchAsync(async (req, res) => {
  const request = await mealRequestService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: request });
});

const approve = catchAsync(async (req, res) => {
  const request = await mealRequestService.approve(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: request });
});

const reject = catchAsync(async (req, res) => {
  const request = await mealRequestService.reject(req.params.id, req.body.reason);
  res.status(200).json({ success: true, data: request });
});

const updateStatus = catchAsync(async (req, res) => {
  const request = await mealRequestService.updateStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: request });
});

module.exports = { create, getById, list, update, approve, reject, updateStatus };
