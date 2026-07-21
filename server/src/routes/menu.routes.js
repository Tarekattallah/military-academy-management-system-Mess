const express = require('express');
const menuController = require('../controllers/menu.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const menuValidation = require('../validations/menu.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('menus:create'), validate(menuValidation.create, 'body'), menuController.create);
router.get('/', authorize('menus:view'), validate(menuValidation.query, 'query'), menuController.list);
router.get('/:id', authorize('menus:view'), menuController.getById);
router.put('/:id', authorize('menus:update'), validate(menuValidation.update, 'body'), menuController.update);
router.patch('/:id/status', authorize('menus:update'), validate(menuValidation.statusUpdate, 'body'), menuController.updateStatus);

module.exports = router;
