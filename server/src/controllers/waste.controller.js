const wasteService = require('../services/waste.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const waste = await wasteService.create(data);
  res.status(201).json({ success: true, data: waste });
});

const getById = catchAsync(async (req, res) => {
  const waste = await wasteService.getById(req.params.id);
  res.status(200).json({ success: true, data: waste });
});

const list = catchAsync(async (req, res) => {
  const wastes = await wasteService.list(req.query);
  res.status(200).json({ success: true, data: wastes });
});

const cancel = catchAsync(async (req, res) => {
  const waste = await wasteService.cancel(req.params.id, req.user.id, req.body.reason);
  res.status(200).json({ success: true, data: waste });
});

module.exports = { create, getById, list, cancel };
