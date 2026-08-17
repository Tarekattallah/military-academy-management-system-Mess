const dashboardService = require('../services/dashboard.service');
const catchAsync = require('../utils/catchAsync');

const getSummary = catchAsync(async (req, res) => {
  const result = await dashboardService.getSummary();
  res.status(200).json({ success: true, data: result });
});

const getInventoryOverview = catchAsync(async (req, res) => {
  const result = await dashboardService.getInventoryOverview();
  res.status(200).json({ success: true, data: result });
});

const getTodayOperations = catchAsync(async (req, res) => {
  const result = await dashboardService.getTodayOperations();
  res.status(200).json({ success: true, data: result });
});

const getConsumptionAnalytics = catchAsync(async (req, res) => {
  const result = await dashboardService.getConsumptionAnalytics();
  res.status(200).json({ success: true, data: result });
});

const getWasteAnalytics = catchAsync(async (req, res) => {
  const result = await dashboardService.getWasteAnalytics();
  res.status(200).json({ success: true, data: result });
});

const getReservationAnalytics = catchAsync(async (req, res) => {
  const result = await dashboardService.getReservationAnalytics();
  res.status(200).json({ success: true, data: result });
});

const getDistributionAnalytics = catchAsync(async (req, res) => {
  const result = await dashboardService.getDistributionAnalytics();
  res.status(200).json({ success: true, data: result });
});

const getWarehouseStatistics = catchAsync(async (req, res) => {
  const result = await dashboardService.getWarehouseStatistics();
  res.status(200).json({ success: true, data: result });
});

const getCostAnalytics = catchAsync(async (req, res) => {
  const result = await dashboardService.getCostAnalytics();
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  getSummary,
  getInventoryOverview,
  getTodayOperations,
  getConsumptionAnalytics,
  getWasteAnalytics,
  getReservationAnalytics,
  getDistributionAnalytics,
  getWarehouseStatistics,
  getCostAnalytics,
};
