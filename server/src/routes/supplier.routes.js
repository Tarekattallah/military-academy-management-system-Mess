const express = require('express');
const supplierController = require('../controllers/supplier.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const supplierValidation = require('../validations/supplier.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('suppliers:view'), supplierController.list);
router.get('/:id', authorize('suppliers:view'), supplierController.getById);
router.post('/', authorize('suppliers:create'), validate(supplierValidation.create), supplierController.create);
router.patch('/:id', authorize('suppliers:update'), validate(supplierValidation.update), supplierController.update);
router.delete('/:id', authorize('suppliers:delete'), supplierController.remove);

module.exports = router;
