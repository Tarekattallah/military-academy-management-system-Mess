const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  quantity: Joi.number().min(0.001).required(),
  unit: Joi.string().hex().length(24).required(),
});

const create = Joi.object({
  recipeNumber: Joi.string().trim().optional(),
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).optional().allow('', null),
  category: Joi.string().hex().length(24).optional().allow('', null),
  yield: Joi.number().integer().min(1).required(),
  standardCost: Joi.number().min(0).optional(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const update = Joi.object({
  recipeNumber: Joi.string().trim().optional(),
  name: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(1000).optional().allow('', null),
  category: Joi.string().hex().length(24).optional().allow('', null),
  yield: Joi.number().integer().min(1).optional(),
  standardCost: Joi.number().min(0).optional(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  items: Joi.array().items(itemSchema).min(1).optional(),
}).min(1);

const statusUpdate = Joi.object({
  status: Joi.string().valid('active', 'inactive').required(),
});

const query = Joi.object({
  name: Joi.string().trim().optional(),
  category: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  search: Joi.string().trim().optional(),
});

module.exports = { create, update, statusUpdate, query };
