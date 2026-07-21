const express = require('express');
const unitController = require('../controllers/unit.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const unitValidation = require('../validations/unit.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('units:view'), unitController.list);
router.get('/:id', authorize('units:view'), unitController.getById);
router.post('/', authorize('units:create'), validate(unitValidation.create), unitController.create);
router.patch('/:id', authorize('units:update'), validate(unitValidation.update), unitController.update);
router.delete('/:id', authorize('units:delete'), unitController.remove);

module.exports = router;
