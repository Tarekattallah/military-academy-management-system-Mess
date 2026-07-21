const Joi = require('joi');

const create = Joi.object({
  username: Joi.string().trim().lowercase().min(3).max(50).required(),
  email: Joi.string().trim().lowercase().email().optional().allow('', null),
  displayName: Joi.string().trim().min(2).max(100).required(),
  password: Joi.string().min(6).required(),
  roles: Joi.array().items(Joi.string().hex().length(24)).optional(),
  status: Joi.string().valid('active', 'inactive', 'locked').optional(),
});

const update = Joi.object({
  email: Joi.string().trim().lowercase().email().optional().allow('', null),
  displayName: Joi.string().trim().min(2).max(100).optional(),
  password: Joi.string().min(6).optional(),
  roles: Joi.array().items(Joi.string().hex().length(24)).optional(),
  status: Joi.string().valid('active', 'inactive', 'locked').optional(),
}).min(1);

module.exports = { create, update };
