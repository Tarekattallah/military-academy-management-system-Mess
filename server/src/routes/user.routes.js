const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const userValidation = require('../validations/user.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('users:view'), userController.list);
router.get('/:id', authorize('users:view'), userController.getById);
router.post('/', authorize('users:create'), validate(userValidation.create), userController.create);
router.patch(
  '/:id',
  authorize('users:update'),
  validate(userValidation.update),
  userController.update
);
router.delete('/:id', authorize('users:delete'), userController.remove);

module.exports = router;
