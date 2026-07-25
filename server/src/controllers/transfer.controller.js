const transferService = require('../services/transfer.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const transfer = await transferService.create(data);
  res.status(201).json({ success: true, data: transfer });
});

const getById = catchAsync(async (req, res) => {
  const transfer = await transferService.getById(req.params.id);
  res.status(200).json({ success: true, data: transfer });
});

const list = catchAsync(async (req, res) => {
  const transfers = await transferService.list(req.query);
  res.status(200).json({ success: true, data: transfers });
});

const cancel = catchAsync(async (req, res) => {
  const transfer = await transferService.cancel(req.params.id, req.user.id, req.body.reason);
  res.status(200).json({ success: true, data: transfer });
});

module.exports = { create, getById, list, cancel };
