const warehouseService = require('../services/warehouse.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const warehouses = await warehouseService.list();
  res.status(200).json({ success: true, data: warehouses });
});

const getById = catchAsync(async (req, res) => {
  const warehouse = await warehouseService.getById(req.params.id);
  res.status(200).json({ success: true, data: warehouse });
});

const create = catchAsync(async (req, res) => {
  const warehouse = await warehouseService.create(req.body);
  res.status(201).json({ success: true, data: warehouse });
});

const update = catchAsync(async (req, res) => {
  const warehouse = await warehouseService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: warehouse });
});

const remove = catchAsync(async (req, res) => {
  await warehouseService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Warehouse deleted successfully' });
});

module.exports = { list, getById, create, update, remove };
