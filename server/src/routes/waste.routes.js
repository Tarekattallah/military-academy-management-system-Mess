const express = require('express');
const wasteController = require('../controllers/waste.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const wasteValidation = require('../validations/waste.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('wastes:create'), validate(wasteValidation.create, 'body'), wasteController.create);
router.get('/', authorize('wastes:view'), validate(wasteValidation.query, 'query'), wasteController.list);
router.get('/:id', authorize('wastes:view'), wasteController.getById);
router.post('/:id/cancel', authorize('wastes:delete'), validate(wasteValidation.cancel, 'body'), wasteController.cancel);

module.exports = router;
