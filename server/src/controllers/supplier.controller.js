const supplierService = require('../services/supplier.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const suppliers = await supplierService.list();
  res.status(200).json({ success: true, data: suppliers });
});

const getById = catchAsync(async (req, res) => {
  const supplier = await supplierService.getById(req.params.id);
  res.status(200).json({ success: true, data: supplier });
});

const create = catchAsync(async (req, res) => {
  const supplier = await supplierService.create(req.body);
  res.status(201).json({ success: true, data: supplier });
});

const update = catchAsync(async (req, res) => {
  const supplier = await supplierService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: supplier });
});

const remove = catchAsync(async (req, res) => {
  await supplierService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
});

module.exports = { list, getById, create, update, remove };
