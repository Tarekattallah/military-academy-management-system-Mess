const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  batch: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required(),
});

const create = Joi.object({
  returnType: Joi.string().valid('return_to_supplier', 'internal_return').required(),
  warehouse: Joi.string().hex().length(24).required(),
  supplier: Joi.string().hex().length(24).optional(),
  referenceType: Joi.string().valid('Transfer', '').allow('', null).optional(),
  referenceId: Joi.string().allow('', null).custom((value, helpers) => {
    if (value && value.length > 0 && !/^[a-f0-9]{24}$/i.test(value)) {
      return helpers.error('string.pattern.base', { message: 'referenceId must be a valid 24-character hex ID' });
    }
    return value;
  }).optional(),
  returnDate: Joi.date().iso().optional(),
  reason: Joi.string().trim().max(500).optional(),
  notes: Joi.string().trim().max(500).optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const query = Joi.object({
  warehouse: Joi.string().hex().length(24).optional(),
  returnType: Joi.string().valid('return_to_supplier', 'internal_return').optional(),
  status: Joi.string().valid('draft', 'completed', 'cancelled').optional(),
  referenceType: Joi.string().valid('Transfer').optional(),
  referenceId: Joi.string().hex().length(24).optional(),
  search: Joi.string().trim().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

const cancel = Joi.object({
  reason: Joi.string().trim().max(500).optional(),
});

module.exports = { create, query, cancel };
