const express = require('express');
const permissionController = require('../controllers/permission.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const permissionValidation = require('../validations/permission.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('permissions:view'), permissionController.list);
router.get('/:id', authorize('permissions:view'), permissionController.getById);
router.post(
  '/',
  authorize('permissions:create'),
  validate(permissionValidation.create),
  permissionController.create
);
router.patch(
  '/:id',
  authorize('permissions:update'),
  validate(permissionValidation.update),
  permissionController.update
);
router.delete('/:id', authorize('permissions:delete'), permissionController.remove);

module.exports = router;
