const dailyClosingService = require('../services/dailyClosing.service');
const dailyClosingRepository = require('../repositories/dailyClosing.repository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const openDay = catchAsync(async (req, res) => {
  const { logicalDate, warehouse } = req.body;
  const newDay = await dailyClosingService.openDay(warehouse, logicalDate, req.user.id);
  res.status(201).json({
    status: 'success',
    data: newDay,
  });
});

const startReconciliation = catchAsync(async (req, res) => {
  const closing = await dailyClosingService.startReconciliation(req.params.id, req.user.id);
  res.status(200).json({
    status: 'success',
    data: closing,
  });
});

const submitClosing = catchAsync(async (req, res) => {
  const closing = await dailyClosingService.submitForApproval(req.params.id, req.user.id, req.body.notes);
  res.status(200).json({
    status: 'success',
    data: closing,
  });
});

const approveClosing = catchAsync(async (req, res) => {
  const closing = await dailyClosingService.approveAndClose(req.params.id, req.user.id, req.body.notes);
  res.status(200).json({
    status: 'success',
    data: closing,
  });
});

const getClosings = catchAsync(async (req, res) => {
  const result = await dailyClosingRepository.findAll(req.query);
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    ...result,
  });
});

const getClosingById = catchAsync(async (req, res, next) => {
  const closing = await dailyClosingRepository.findById(req.params.id);
  if (!closing) {
    return next(new AppError('No daily closing found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: closing,
  });
});

module.exports = {
  openDay,
  startReconciliation,
  submitClosing,
  approveClosing,
  getClosings,
  getClosingById,
};
