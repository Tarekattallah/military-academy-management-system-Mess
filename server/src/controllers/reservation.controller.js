const reservationService = require('../services/reservation.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, reservedBy: req.user.id };
  const reservation = await reservationService.create(data);
  res.status(201).json({ success: true, data: reservation });
});

const getById = catchAsync(async (req, res) => {
  const reservation = await reservationService.getById(req.params.id);
  res.status(200).json({ success: true, data: reservation });
});

const list = catchAsync(async (req, res) => {
  const reservations = await reservationService.list(req.query);
  res.status(200).json({ success: true, data: reservations });
});

const release = catchAsync(async (req, res) => {
  const reservation = await reservationService.release(req.params.id, req.user.id, req.body.notes);
  res.status(200).json({ success: true, data: reservation });
});

const consume = catchAsync(async (req, res) => {
  const reservation = await reservationService.consume(req.params.id, req.body.notes);
  res.status(200).json({ success: true, data: reservation });
});

const updateStatus = catchAsync(async (req, res) => {
  const reservation = await reservationService.updateStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: reservation });
});

module.exports = { create, getById, list, release, consume, updateStatus };
