const express = require('express');
const dailyClosingController = require('../controllers/dailyClosing.controller');
const validate = require('../middlewares/validate');
const {
  openDay,
  startReconciliation,
  submitClosing,
  approveClosing,
  getClosings,
} = require('../validations/dailyClosing.validation');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);

// List all daily closings
router.get(
  '/',
  authorize('inventory-transactions:view'),
  validate(getClosings, 'query'),
  dailyClosingController.getClosings
);

router.get(
  '/:id',
  authorize('inventory-transactions:view'),
  dailyClosingController.getClosingById
);

// Open Day (Mess Officer)
router.post(
  '/open',
  authorize('inventory-transactions:view'),
  validate(openDay, 'body'),
  dailyClosingController.openDay
);

// Start Reconciliation (Mess Officer)
router.post(
  '/:id/reconcile',
  authorize('inventory-transactions:view'),
  validate(startReconciliation, 'params'),
  dailyClosingController.startReconciliation
);

// Submit for Approval (Mess Officer)
router.post(
  '/:id/submit',
  authorize('inventory-transactions:view'),
  validate(submitClosing, 'body'),
  dailyClosingController.submitClosing
);

// Approve and Close (Commander / Admin)
router.post(
  '/:id/approve',
  authorize('stock-counts:approve'), // Using an existing high-level approval permission
  validate(approveClosing, 'body'),
  dailyClosingController.approveClosing
);

module.exports = router;
