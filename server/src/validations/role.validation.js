const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().allow('', null).optional(),
  permissions: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

const update = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().allow('', null).optional(),
  permissions: Joi.array().items(Joi.string().hex().length(24)).optional(),
}).min(1);

module.exports = { create, update };
