const inventoryTransactionService = require('../services/inventoryTransaction.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
  const transactions = await inventoryTransactionService.list(req.query);
  res.status(200).json({ success: true, data: transactions });
});

const getById = catchAsync(async (req, res) => {
  const transaction = await inventoryTransactionService.getById(req.params.id);
  res.status(200).json({ success: true, data: transaction });
});

const create = catchAsync(async (req, res) => {
  const transaction = await inventoryTransactionService.create(req.body);
  res.status(201).json({ success: true, data: transaction });
});

module.exports = { list, getById, create };
