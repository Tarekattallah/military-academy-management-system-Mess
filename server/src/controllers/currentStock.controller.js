const currentStockService = require('../services/currentStock.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const stocks = await currentStockService.list(req.query);
  res.status(200).json({ success: true, data: stocks });
});

const getById = catchAsync(async (req, res) => {
  const stock = await currentStockService.getById(req.params.id);
  res.status(200).json({ success: true, data: stock });
});

const getByProductAndWarehouse = catchAsync(async (req, res) => {
  const { productId, warehouseId } = req.params;
  const stock = await currentStockService.getByProductAndWarehouse(productId, warehouseId);
  res.status(200).json({ success: true, data: stock });
});

const refreshAll = catchAsync(async (req, res) => {
  const results = await currentStockService.refreshAll();
  res.status(200).json({ success: true, data: results, message: 'CurrentStock refreshed from batches' });
});

module.exports = { list, getById, getByProductAndWarehouse, refreshAll };
