const Joi = require('joi');

const create = Joi.object({
  mealRequest: Joi.string().hex().length(24).required(),
  warehouse: Joi.string().hex().length(24).required(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const release = Joi.object({
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const consume = Joi.object({
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const statusUpdate = Joi.object({
  status: Joi.string().valid('draft', 'reserved', 'released', 'consumed').required(),
});

const query = Joi.object({
  status: Joi.string().valid('draft', 'reserved', 'released', 'consumed').optional(),
  mealRequest: Joi.string().hex().length(24).optional(),
  warehouse: Joi.string().hex().length(24).optional(),
  search: Joi.string().trim().optional(),
});

module.exports = { create, release, consume, statusUpdate, query };
