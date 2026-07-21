const express = require('express');
const returnController = require('../controllers/return.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const returnValidation = require('../validations/return.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('returns:create'), validate(returnValidation.create, 'body'), returnController.create);
router.get('/', authorize('returns:view'), validate(returnValidation.query, 'query'), returnController.list);
router.get('/:id', authorize('returns:view'), returnController.getById);

module.exports = router;
