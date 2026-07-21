const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const users = await userService.list();
  res.status(200).json({ success: true, data: users });
});

const getById = catchAsync(async (req, res) => {
  const user = await userService.getById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

const create = catchAsync(async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json({ success: true, data: user });
});

const update = catchAsync(async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: user });
});

const remove = catchAsync(async (req, res) => {
  await userService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

module.exports = { list, getById, create, update, remove };
