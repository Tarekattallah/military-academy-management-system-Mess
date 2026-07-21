const express = require('express');
const warehouseController = require('../controllers/warehouse.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const warehouseValidation = require('../validations/warehouse.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('warehouses:view'), warehouseController.list);
router.get('/:id', authorize('warehouses:view'), warehouseController.getById);
router.post('/', authorize('warehouses:create'), validate(warehouseValidation.create), warehouseController.create);
router.patch('/:id', authorize('warehouses:update'), validate(warehouseValidation.update), warehouseController.update);
router.delete('/:id', authorize('warehouses:delete'), warehouseController.remove);

module.exports = router;
