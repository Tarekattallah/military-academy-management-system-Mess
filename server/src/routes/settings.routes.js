const express = require('express');
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const settingsValidation = require('../validations/settings.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('settings:view'), settingsController.getSettings);
router.put('/', authorize('settings:update'), validate(settingsValidation.update, 'body'), settingsController.updateSettings);

module.exports = router;
