const express = require('express');
const inventoryTransactionController = require('../controllers/inventoryTransaction.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const inventoryTransactionValidation = require('../validations/inventoryTransaction.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('inventory-transactions:view'), validate(inventoryTransactionValidation.query, 'query'), inventoryTransactionController.list);
router.get('/:id', authorize('inventory-transactions:view'), inventoryTransactionController.getById);
router.post('/', authorize('inventory-transactions:create'), validate(inventoryTransactionValidation.create), inventoryTransactionController.create);

module.exports = router;
