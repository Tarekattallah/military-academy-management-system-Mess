const menuService = require('../services/menu.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const menu = await menuService.create(data);
  res.status(201).json({ success: true, data: menu });
});

const getById = catchAsync(async (req, res) => {
  const menu = await menuService.getById(req.params.id);
  res.status(200).json({ success: true, data: menu });
});

const list = catchAsync(async (req, res) => {
  const menus = await menuService.list(req.query);
  res.status(200).json({ success: true, data: menus });
});

const update = catchAsync(async (req, res) => {
  const menu = await menuService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: menu });
});

const updateStatus = catchAsync(async (req, res) => {
  const menu = await menuService.updateStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: menu });
});

module.exports = { create, getById, list, update, updateStatus };
