const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  sourceBatch: Joi.string().hex().length(24).required(),
  destinationBatchNumber: Joi.string().trim().uppercase().required(),
  quantity: Joi.number().positive().required(),
});

const create = Joi.object({
  sourceWarehouse: Joi.string().hex().length(24).required(),
  destinationWarehouse: Joi.string().hex().length(24).required(),
  transferDate: Joi.date().iso().optional(),
  notes: Joi.string().trim().max(500).optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const query = Joi.object({
  sourceWarehouse: Joi.string().hex().length(24).optional(),
  destinationWarehouse: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('draft', 'completed', 'cancelled').optional(),
  search: Joi.string().trim().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

module.exports = { create, query };
