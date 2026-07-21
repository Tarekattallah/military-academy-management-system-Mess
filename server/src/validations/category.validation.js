const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const update = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(500).optional().allow('', null),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { create, update };
