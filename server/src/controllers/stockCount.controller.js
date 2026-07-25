const stockCountService = require('../services/stockCount.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const stockCount = await stockCountService.create(data);
  res.status(201).json({ success: true, data: stockCount });
});

const getById = catchAsync(async (req, res) => {
  const stockCount = await stockCountService.getById(req.params.id);
  res.status(200).json({ success: true, data: stockCount });
});

const list = catchAsync(async (req, res) => {
  const stockCounts = await stockCountService.list(req.query);
  res.status(200).json({ success: true, data: stockCounts });
});

const approve = catchAsync(async (req, res) => {
  const stockCount = await stockCountService.approve(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: stockCount });
});

const cancel = catchAsync(async (req, res) => {
  const stockCount = await stockCountService.cancel(req.params.id, req.user.id, req.body.reason);
  res.status(200).json({ success: true, data: stockCount });
});

module.exports = { create, getById, list, approve, cancel };
