const express = require('express');
const reservationController = require('../controllers/reservation.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const reservationValidation = require('../validations/reservation.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('reservations:create'), validate(reservationValidation.create, 'body'), reservationController.create);
router.get('/', authorize('reservations:view'), validate(reservationValidation.query, 'query'), reservationController.list);
router.get('/:id', authorize('reservations:view'), reservationController.getById);
router.post('/:id/release', authorize('reservations:release'), validate(reservationValidation.release, 'body'), reservationController.release);
router.post('/:id/consume', authorize('reservations:consume'), validate(reservationValidation.consume, 'body'), reservationController.consume);
router.patch('/:id/status', authorize('reservations:update'), validate(reservationValidation.statusUpdate, 'body'), reservationController.updateStatus);

module.exports = router;
