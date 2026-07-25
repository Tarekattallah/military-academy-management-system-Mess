const receivingService = require('../services/receiving.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const receiving = await receivingService.create(data);
  res.status(201).json({ success: true, data: receiving });
});

const getById = catchAsync(async (req, res) => {
  const receiving = await receivingService.getById(req.params.id);
  res.status(200).json({ success: true, data: receiving });
});

const list = catchAsync(async (req, res) => {
  const receivings = await receivingService.list(req.query);
  res.status(200).json({ success: true, data: receivings });
});

const cancel = catchAsync(async (req, res) => {
  const receiving = await receivingService.cancel(req.params.id, req.user.id, req.body.reason);
  res.status(200).json({ success: true, data: receiving });
});

module.exports = { create, getById, list, cancel };
