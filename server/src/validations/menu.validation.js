const Joi = require('joi');

const itemSchema = Joi.object({
  recipe: Joi.string().hex().length(24).required(),
  plannedServings: Joi.number().integer().min(1).required(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const create = Joi.object({
  menuNumber: Joi.string().trim().optional(),
  menuDate: Joi.date().iso().required(),
  mealType: Joi.string().valid('breakfast', 'lunch', 'dinner').required(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const update = Joi.object({
  menuNumber: Joi.string().trim().optional(),
  menuDate: Joi.date().iso().optional(),
  mealType: Joi.string().valid('breakfast', 'lunch', 'dinner').optional(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  items: Joi.array().items(itemSchema).min(1).optional(),
}).min(1);

const statusUpdate = Joi.object({
  status: Joi.string().valid('draft', 'published', 'closed').required(),
});

const query = Joi.object({
  menuDate: Joi.date().iso().optional(),
  mealType: Joi.string().valid('breakfast', 'lunch', 'dinner').optional(),
  status: Joi.string().valid('draft', 'published', 'closed').optional(),
  search: Joi.string().trim().optional(),
});

module.exports = { create, update, statusUpdate, query };
