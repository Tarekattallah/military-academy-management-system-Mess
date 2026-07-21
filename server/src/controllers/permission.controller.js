const permissionService = require('../services/permission.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const permissions = await permissionService.list();
  res.status(200).json({ success: true, data: permissions });
});

const getById = catchAsync(async (req, res) => {
  const permission = await permissionService.getById(req.params.id);
  res.status(200).json({ success: true, data: permission });
});

const create = catchAsync(async (req, res) => {
  const permission = await permissionService.create(req.body);
  res.status(201).json({ success: true, data: permission });
});

const update = catchAsync(async (req, res) => {
  const permission = await permissionService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: permission });
});

const remove = catchAsync(async (req, res) => {
  await permissionService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Permission deleted successfully' });
});

module.exports = { list, getById, create, update, remove };
