const express = require('express');
const categoryController = require('../controllers/category.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const categoryValidation = require('../validations/category.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('categories:view'), categoryController.list);
router.get('/:id', authorize('categories:view'), categoryController.getById);
router.post('/', authorize('categories:create'), validate(categoryValidation.create), categoryController.create);
router.patch('/:id', authorize('categories:update'), validate(categoryValidation.update), categoryController.update);
router.delete('/:id', authorize('categories:delete'), categoryController.remove);

module.exports = router;
