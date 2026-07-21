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

module.exports = { create, getById, list };
