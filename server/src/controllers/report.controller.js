const reportService = require('../services/report.service');
const catchAsync = require('../utils/catchAsync');

const getInventoryReport = catchAsync(async (req, res) => {
  const result = await reportService.getInventoryReport(req.query);
  res.status(200).json({ success: true, ...result });
});

const getBatchReport = catchAsync(async (req, res) => {
  const result = await reportService.getBatchReport(req.query);
  res.status(200).json({ success: true, ...result });
});

const getReceivingReport = catchAsync(async (req, res) => {
  const result = await reportService.getReceivingReport(req.query);
  res.status(200).json({ success: true, ...result });
});

const getTransferReport = catchAsync(async (req, res) => {
  const result = await reportService.getTransferReport(req.query);
  res.status(200).json({ success: true, ...result });
});

const getWasteReport = catchAsync(async (req, res) => {
  const result = await reportService.getWasteReport(req.query);
  res.status(200).json({ success: true, ...result });
});

const getReservationReport = catchAsync(async (req, res) => {
  const result = await reportService.getReservationReport(req.query);
  res.status(200).json({ success: true, ...result });
});

const getMealDistributionReport = catchAsync(async (req, res) => {
  const result = await reportService.getMealDistributionReport(req.query);
  res.status(200).json({ success: true, ...result });
});

const getConsumptionReport = catchAsync(async (req, res) => {
  const result = await reportService.getConsumptionReport(req.query);
  res.status(200).json({ success: true, ...result });
});

module.exports = {
  getInventoryReport,
  getBatchReport,
  getReceivingReport,
  getTransferReport,
  getWasteReport,
  getReservationReport,
  getMealDistributionReport,
  getConsumptionReport,
};
