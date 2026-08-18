const Joi = require('joi');

const openDay = Joi.object({
  logicalDate: Joi.date().iso().required(),
  warehouse: Joi.string().hex().length(24).required(),
});

const startReconciliation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const submitClosing = Joi.object({
  notes: Joi.string().allow('', null).optional(),
});

const approveClosing = Joi.object({
  // Approval typically just changes status, maybe notes
  notes: Joi.string().allow('', null).optional(),
});

const getClosings = Joi.object({
  logicalDate: Joi.date().iso().optional(),
  warehouse: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('OPEN', 'RECONCILING', 'PENDING_APPROVAL', 'CLOSED').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().optional(),
});

module.exports = {
  openDay,
  startReconciliation,
  submitClosing,
  approveClosing,
  getClosings,
};
