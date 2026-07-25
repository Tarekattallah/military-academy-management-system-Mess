const express = require('express');
const receivingController = require('../controllers/receiving.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const receivingValidation = require('../validations/receiving.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('receiving:view'), validate(receivingValidation.query, 'query'), receivingController.list);
router.get('/:id', authorize('receiving:view'), receivingController.getById);
router.post('/', authorize('receiving:create'), validate(receivingValidation.create), receivingController.create);
router.post('/:id/cancel', authorize('receiving:delete'), validate(receivingValidation.cancel), receivingController.cancel);

module.exports = router;
