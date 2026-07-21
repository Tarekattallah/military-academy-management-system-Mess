const returnService = require('../services/return.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const returnDoc = await returnService.create(data);
  res.status(201).json({ success: true, data: returnDoc });
});

const getById = catchAsync(async (req, res) => {
  const returnDoc = await returnService.getById(req.params.id);
  res.status(200).json({ success: true, data: returnDoc });
});

const list = catchAsync(async (req, res) => {
  const returns = await returnService.list(req.query);
  res.status(200).json({ success: true, data: returns });
});

module.exports = { create, getById, list };
