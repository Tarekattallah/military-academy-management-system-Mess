const express = require('express');
const recipeController = require('../controllers/recipe.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const recipeValidation = require('../validations/recipe.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('recipes:create'), validate(recipeValidation.create, 'body'), recipeController.create);
router.get('/', authorize('recipes:view'), validate(recipeValidation.query, 'query'), recipeController.list);
router.get('/:id', authorize('recipes:view'), recipeController.getById);
router.put('/:id', authorize('recipes:update'), validate(recipeValidation.update, 'body'), recipeController.update);
router.patch('/:id/status', authorize('recipes:update'), validate(recipeValidation.statusUpdate, 'body'), recipeController.updateStatus);

module.exports = router;
