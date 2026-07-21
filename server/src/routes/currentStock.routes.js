const express = require('express');
const currentStockController = require('../controllers/currentStock.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const currentStockValidation = require('../validations/currentStock.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('current-stock:view'), validate(currentStockValidation.query, 'query'), currentStockController.list);
router.get('/by-product/:productId/warehouse/:warehouseId', authorize('current-stock:view'), currentStockController.getByProductAndWarehouse);
router.get('/refresh', authorize('current-stock:update'), currentStockController.refreshAll);
router.get('/:id', authorize('current-stock:view'), currentStockController.getById);

module.exports = router;
