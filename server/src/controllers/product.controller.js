const productService = require('../services/product.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const products = await productService.list();
  res.status(200).json({ success: true, data: products });
});

const listAll = catchAsync(async (req, res) => {
  const products = await productService.listAll();
  res.status(200).json({ success: true, data: products });
});

const getById = catchAsync(async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.status(200).json({ success: true, data: product });
});

const create = catchAsync(async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json({ success: true, data: product });
});

const update = catchAsync(async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: product });
});

const remove = catchAsync(async (req, res) => {
  await productService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Product deleted successfully' });
});

module.exports = { list, listAll, getById, create, update, remove };
