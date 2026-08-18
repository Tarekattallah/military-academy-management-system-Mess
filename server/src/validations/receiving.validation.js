const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  batchNumber: Joi.string().trim().max(100).required(),
  quantity: Joi.number().positive().required(),
  unitCost: Joi.number().min(0).optional(),
  manufacturingDate: Joi.date().iso().optional().allow(null),
  expiryDate: Joi.date().iso().optional().allow(null),
});

const create = Joi.object({
  purchaseOrder: Joi.string().hex().length(24).required(),
  supplier: Joi.string().hex().length(24).required(),
  warehouse: Joi.string().hex().length(24).required(),
  receivingDate: Joi.date().iso().optional(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const query = Joi.object({
  supplier: Joi.string().hex().length(24).optional(),
  warehouse: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('draft', 'completed', 'cancelled').optional(),
  search: Joi.string().trim().max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

const cancel = Joi.object({
  reason: Joi.string().trim().max(500).optional().allow('', null),
});

module.exports = { create, query, cancel };
