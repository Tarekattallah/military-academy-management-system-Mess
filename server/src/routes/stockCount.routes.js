const express = require('express');
const stockCountController = require('../controllers/stockCount.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const stockCountValidation = require('../validations/stockCount.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('stock-counts:create'), validate(stockCountValidation.create, 'body'), stockCountController.create);
router.get('/', authorize('stock-counts:view'), validate(stockCountValidation.query, 'query'), stockCountController.list);
router.get('/:id', authorize('stock-counts:view'), stockCountController.getById);
router.post('/:id/approve', authorize('stock-counts:approve'), validate(stockCountValidation.approve, 'body'), stockCountController.approve);
router.post('/:id/cancel', authorize('stock-counts:delete'), validate(stockCountValidation.cancel, 'body'), stockCountController.cancel);

module.exports = router;
