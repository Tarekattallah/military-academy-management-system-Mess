const express = require('express');
const reportController = require('../controllers/report.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const reportValidation = require('../validations/report.validation');

const router = express.Router();

router.use(authenticate);

// Inventory Report
router.get(
  '/inventory',
  authorize('reports:view'),
  validate(reportValidation.inventoryReportQuery, 'query'),
  reportController.getInventoryReport
);

// Batch Report
router.get(
  '/batches',
  authorize('reports:view'),
  validate(reportValidation.batchReportQuery, 'query'),
  reportController.getBatchReport
);

// Receiving Report
router.get(
  '/receiving',
  authorize('reports:view'),
  validate(reportValidation.receivingReportQuery, 'query'),
  reportController.getReceivingReport
);

// Transfer Report
router.get(
  '/transfers',
  authorize('reports:view'),
  validate(reportValidation.transferReportQuery, 'query'),
  reportController.getTransferReport
);

// Waste Report
router.get(
  '/wastes',
  authorize('reports:view'),
  validate(reportValidation.wasteReportQuery, 'query'),
  reportController.getWasteReport
);

// Reservation Report
router.get(
  '/reservations',
  authorize('reports:view'),
  validate(reportValidation.reservationReportQuery, 'query'),
  reportController.getReservationReport
);

// Meal Distribution Report
router.get(
  '/meal-distributions',
  authorize('reports:view'),
  validate(reportValidation.mealDistributionReportQuery, 'query'),
  reportController.getMealDistributionReport
);

// Consumption Report
router.get(
  '/consumption',
  authorize('reports:view'),
  validate(reportValidation.consumptionReportQuery, 'query'),
  reportController.getConsumptionReport
);

module.exports = router;
