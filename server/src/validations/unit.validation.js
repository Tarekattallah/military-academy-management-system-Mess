const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(1).max(50).required(),
  abbreviation: Joi.string().trim().min(1).max(10).required(),
  category: Joi.string().valid('weight', 'volume', 'quantity', 'length', 'other').required(),
  description: Joi.string().trim().max(500).optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const update = Joi.object({
  name: Joi.string().trim().min(1).max(50).optional(),
  abbreviation: Joi.string().trim().min(1).max(10).optional(),
  category: Joi.string().valid('weight', 'volume', 'quantity', 'length', 'other').optional(),
  description: Joi.string().trim().max(500).optional().allow('', null),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { create, update };
