const mealDistributionService = require('../services/mealDistribution.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, distributedBy: req.user.id };
  const distribution = await mealDistributionService.create(data);
  res.status(201).json({ success: true, data: distribution });
});

const getById = catchAsync(async (req, res) => {
  const distribution = await mealDistributionService.getById(req.params.id);
  res.status(200).json({ success: true, data: distribution });
});

const list = catchAsync(async (req, res) => {
  const distributions = await mealDistributionService.list(req.query);
  res.status(200).json({ success: true, data: distributions });
});

const complete = catchAsync(async (req, res) => {
  const distribution = await mealDistributionService.complete(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, data: distribution });
});

const cancel = catchAsync(async (req, res) => {
  const distribution = await mealDistributionService.cancel(req.params.id, req.body.reason, req.user.id);
  res.status(200).json({ success: true, data: distribution });
});

const updateStatus = catchAsync(async (req, res) => {
  const distribution = await mealDistributionService.updateStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: distribution });
});

module.exports = { create, getById, list, complete, cancel, updateStatus };
