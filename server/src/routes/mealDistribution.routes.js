const express = require('express');
const mealDistributionController = require('../controllers/mealDistribution.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const mealDistributionValidation = require('../validations/mealDistribution.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('meal-distributions:create'), validate(mealDistributionValidation.create, 'body'), mealDistributionController.create);
router.get('/', authorize('meal-distributions:view'), validate(mealDistributionValidation.query, 'query'), mealDistributionController.list);
router.get('/:id', authorize('meal-distributions:view'), mealDistributionController.getById);
router.post('/:id/complete', authorize('meal-distributions:complete'), validate(mealDistributionValidation.complete, 'body'), mealDistributionController.complete);
router.post('/:id/cancel', authorize('meal-distributions:cancel'), validate(mealDistributionValidation.cancel, 'body'), mealDistributionController.cancel);
router.patch('/:id/status', authorize('meal-distributions:update'), validate(mealDistributionValidation.statusUpdate, 'body'), mealDistributionController.updateStatus);

module.exports = router;
