const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  code: Joi.string().trim().min(1).max(20).required(),
  location: Joi.string().trim().max(200).optional().allow('', null),
  manager: Joi.string().trim().max(100).optional().allow('', null),
  phone: Joi.string().trim().max(30).optional().allow('', null),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const update = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  code: Joi.string().trim().min(1).max(20).optional(),
  location: Joi.string().trim().max(200).optional().allow('', null),
  manager: Joi.string().trim().max(100).optional().allow('', null),
  phone: Joi.string().trim().max(30).optional().allow('', null),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { create, update };
