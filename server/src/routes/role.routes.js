const express = require('express');
const roleController = require('../controllers/role.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const roleValidation = require('../validations/role.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('roles:view'), roleController.list);
router.get('/:id', authorize('roles:view'), roleController.getById);
router.post('/', authorize('roles:create'), validate(roleValidation.create), roleController.create);
router.patch(
  '/:id',
  authorize('roles:update'),
  validate(roleValidation.update),
  roleController.update
);
router.delete('/:id', authorize('roles:delete'), roleController.remove);

module.exports = router;
