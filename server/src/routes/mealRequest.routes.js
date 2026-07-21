const express = require('express');
const mealRequestController = require('../controllers/mealRequest.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const mealRequestValidation = require('../validations/mealRequest.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('meal-requests:create'), validate(mealRequestValidation.create, 'body'), mealRequestController.create);
router.get('/', authorize('meal-requests:view'), validate(mealRequestValidation.query, 'query'), mealRequestController.list);
router.get('/:id', authorize('meal-requests:view'), mealRequestController.getById);
router.put('/:id', authorize('meal-requests:update'), validate(mealRequestValidation.update, 'body'), mealRequestController.update);
router.post('/:id/approve', authorize('meal-requests:approve'), validate(mealRequestValidation.approve, 'body'), mealRequestController.approve);
router.post('/:id/reject', authorize('meal-requests:approve'), validate(mealRequestValidation.reject, 'body'), mealRequestController.reject);
router.patch('/:id/status', authorize('meal-requests:update'), validate(mealRequestValidation.statusUpdate, 'body'), mealRequestController.updateStatus);

module.exports = router;
