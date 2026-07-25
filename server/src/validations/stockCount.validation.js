const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  batch: Joi.string().hex().length(24).required(),
  systemQuantity: Joi.number().min(0).required(),
  physicalQuantity: Joi.number().min(0).required(),
});

const create = Joi.object({
  warehouse: Joi.string().hex().length(24).required(),
  countDate: Joi.date().iso().optional(),
  notes: Joi.string().trim().max(500).optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const approve = Joi.object({
  approvedBy: Joi.string().hex().length(24).required(),
});

const query = Joi.object({
  warehouse: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('draft', 'in_progress', 'completed', 'approved', 'cancelled').optional(),
  search: Joi.string().trim().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

const cancel = Joi.object({
  reason: Joi.string().trim().max(500).optional(),
});

module.exports = { create, approve, query, cancel };
