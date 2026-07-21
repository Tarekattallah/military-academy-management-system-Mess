const express = require('express');
const productController = require('../controllers/product.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const productValidation = require('../validations/product.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('products:view'), productController.list);
router.get('/all', authorize('products:view'), productController.listAll);
router.get('/:id', authorize('products:view'), productController.getById);
router.post('/', authorize('products:create'), validate(productValidation.create), productController.create);
router.patch('/:id', authorize('products:update'), validate(productValidation.update), productController.update);
router.delete('/:id', authorize('products:delete'), productController.remove);

module.exports = router;
