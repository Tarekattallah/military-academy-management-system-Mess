const express = require('express');
const transferController = require('../controllers/transfer.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const transferValidation = require('../validations/transfer.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('transfers:create'), validate(transferValidation.create, 'body'), transferController.create);
router.get('/', authorize('transfers:view'), validate(transferValidation.query, 'query'), transferController.list);
router.get('/:id', authorize('transfers:view'), transferController.getById);

module.exports = router;
