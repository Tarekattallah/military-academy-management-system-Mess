const unitService = require('../services/unit.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const units = await unitService.list();
  res.status(200).json({ success: true, data: units });
});

const getById = catchAsync(async (req, res) => {
  const unit = await unitService.getById(req.params.id);
  res.status(200).json({ success: true, data: unit });
});

const create = catchAsync(async (req, res) => {
  const unit = await unitService.create(req.body);
  res.status(201).json({ success: true, data: unit });
});

const update = catchAsync(async (req, res) => {
  const unit = await unitService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: unit });
});

const remove = catchAsync(async (req, res) => {
  await unitService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Unit deleted successfully' });
});

module.exports = { list, getById, create, update, remove };
