const batchService = require('../services/batch.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const batches = await batchService.list(req.query);
  res.status(200).json({ success: true, data: batches });
});

const getById = catchAsync(async (req, res) => {
  const batch = await batchService.getById(req.params.id);
  res.status(200).json({ success: true, data: batch });
});

const create = catchAsync(async (req, res) => {
  const batch = await batchService.create(req.body);
  res.status(201).json({ success: true, data: batch });
});

const update = catchAsync(async (req, res) => {
  const batch = await batchService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: batch });
});

const remove = catchAsync(async (req, res) => {
  await batchService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Batch deleted successfully' });
});

module.exports = { list, getById, create, update, remove };
