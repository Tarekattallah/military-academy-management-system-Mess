const Joi = require('joi');

const itemSchema = Joi.object({
  recipe: Joi.string().hex().length(24).required(),
  requestedServings: Joi.number().integer().min(1).required(),
});

const create = Joi.object({
  requestDate: Joi.date().iso().optional(),
  requestingUnit: Joi.string().trim().min(1).max(200).required(),
  menu: Joi.string().hex().length(24).required(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const update = Joi.object({
  requestDate: Joi.date().iso().optional(),
  requestingUnit: Joi.string().trim().min(1).max(200).optional(),
  menu: Joi.string().hex().length(24).optional(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  items: Joi.array().items(itemSchema).min(1).optional(),
}).min(1);

const approve = Joi.object({
  approvedBy: Joi.string().hex().length(24).optional(),
}).unknown(false);

const reject = Joi.object({
  reason: Joi.string().trim().max(1000).optional().allow('', null),
}).unknown(false);

const statusUpdate = Joi.object({
  status: Joi.string().valid('draft', 'submitted', 'approved', 'rejected', 'completed').required(),
});

const query = Joi.object({
  status: Joi.string().valid('draft', 'submitted', 'approved', 'rejected', 'completed').optional(),
  menu: Joi.string().hex().length(24).optional(),
  requestingUnit: Joi.string().trim().optional(),
  requestDate: Joi.date().iso().optional(),
  search: Joi.string().trim().optional(),
});

module.exports = { create, update, approve, reject, statusUpdate, query };
