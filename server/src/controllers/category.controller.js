const categoryService = require('../services/category.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const categories = await categoryService.list();
  res.status(200).json({ success: true, data: categories });
});

const getById = catchAsync(async (req, res) => {
  const category = await categoryService.getById(req.params.id);
  res.status(200).json({ success: true, data: category });
});

const create = catchAsync(async (req, res) => {
  const category = await categoryService.create(req.body);
  res.status(201).json({ success: true, data: category });
});

const update = catchAsync(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: category });
});

const remove = catchAsync(async (req, res) => {
  await categoryService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Category deleted successfully' });
});

module.exports = { list, getById, create, update, remove };
