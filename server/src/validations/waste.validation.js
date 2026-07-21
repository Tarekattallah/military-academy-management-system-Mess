const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  batch: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required(),
});

const create = Joi.object({
  warehouse: Joi.string().hex().length(24).required(),
  wasteDate: Joi.date().iso().optional(),
  reason: Joi.string().trim().max(500).required(),
  notes: Joi.string().trim().max(500).optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const query = Joi.object({
  warehouse: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('draft', 'completed', 'cancelled').optional(),
  search: Joi.string().trim().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

module.exports = { create, query };
