const Joi = require('joi');

const ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'export', 'print'];

const create = Joi.object({
  module: Joi.string().trim().lowercase().min(2).max(50).required(),
  action: Joi.string()
    .valid(...ACTIONS)
    .required(),
  description: Joi.string().trim().allow('', null).optional(),
});

const update = Joi.object({
  description: Joi.string().trim().allow('', null).optional(),
}).min(1);

module.exports = { create, update };
