const roleService = require('../services/role.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const roles = await roleService.list();
  res.status(200).json({ success: true, data: roles });
});

const getById = catchAsync(async (req, res) => {
  const role = await roleService.getById(req.params.id);
  res.status(200).json({ success: true, data: role });
});

const create = catchAsync(async (req, res) => {
  const role = await roleService.create(req.body);
  res.status(201).json({ success: true, data: role });
});

const update = catchAsync(async (req, res) => {
  const role = await roleService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: role });
});

const remove = catchAsync(async (req, res) => {
  await roleService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Role deleted successfully' });
});

module.exports = { list, getById, create, update, remove };
