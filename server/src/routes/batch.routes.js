const express = require('express');
const batchController = require('../controllers/batch.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const batchValidation = require('../validations/batch.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('batches:view'), validate(batchValidation.query, 'query'), batchController.list);
router.get('/:id', authorize('batches:view'), batchController.getById);
router.post('/', authorize('batches:create'), validate(batchValidation.create), batchController.create);
router.patch('/:id', authorize('batches:update'), validate(batchValidation.update), batchController.update);
router.delete('/:id', authorize('batches:delete'), batchController.remove);

module.exports = router;
