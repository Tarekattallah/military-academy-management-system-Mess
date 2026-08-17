const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const dashboardValidation = require('../validations/dashboard.validation');

const router = express.Router();

router.use(authenticate);

// Dashboard Summary
router.get(
  '/summary',
  authorize('dashboard:view'),
  dashboardController.getSummary
);

// Inventory Overview
router.get(
  '/inventory',
  authorize('dashboard:view'),
  dashboardController.getInventoryOverview
);

// Operations Today
router.get(
  '/today',
  authorize('dashboard:view'),
  dashboardController.getTodayOperations
);

// Consumption Analytics
router.get(
  '/consumption',
  authorize('dashboard:view'),
  dashboardController.getConsumptionAnalytics
);

// Waste Analytics
router.get(
  '/waste',
  authorize('dashboard:view'),
  dashboardController.getWasteAnalytics
);

// Reservation Analytics
router.get(
  '/reservations',
  authorize('dashboard:view'),
  dashboardController.getReservationAnalytics
);

// Distribution Analytics
router.get(
  '/distributions',
  authorize('dashboard:view'),
  dashboardController.getDistributionAnalytics
);

// Warehouse Statistics
router.get(
  '/warehouses',
  authorize('dashboard:view'),
  dashboardController.getWarehouseStatistics
);

// Cost Analytics
router.get(
  '/cost',
  authorize('dashboard:view'),
  dashboardController.getCostAnalytics
);

module.exports = router;
