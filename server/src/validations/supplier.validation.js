const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  code: Joi.string().trim().uppercase().max(50).optional().allow('', null),
  contactPerson: Joi.string().trim().max(100).optional().allow('', null),
  phone: Joi.string().trim().max(30).optional().allow('', null),
  email: Joi.string().trim().email().optional().allow('', null),
  address: Joi.string().trim().max(300).optional().allow('', null),
  taxId: Joi.string().trim().max(50).optional().allow('', null),
  paymentTerms: Joi.string().trim().max(100).optional().allow('', null),
  leadTimeDays: Joi.number().integer().min(0).optional().allow(null),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const update = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  code: Joi.string().trim().uppercase().max(50).optional().allow('', null),
  contactPerson: Joi.string().trim().max(100).optional().allow('', null),
  phone: Joi.string().trim().max(30).optional().allow('', null),
  email: Joi.string().trim().email().optional().allow('', null),
  address: Joi.string().trim().max(300).optional().allow('', null),
  taxId: Joi.string().trim().max(50).optional().allow('', null),
  paymentTerms: Joi.string().trim().max(100).optional().allow('', null),
  leadTimeDays: Joi.number().integer().min(0).optional().allow(null),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { create, update };
