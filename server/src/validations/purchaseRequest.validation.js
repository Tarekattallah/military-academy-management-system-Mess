const Joi = require("joi");

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().hex().length(24).required(),
  notes: Joi.string().trim().max(300).optional().allow("", null),
});

const create = Joi.object({
  warehouse: Joi.string().hex().length(24).required(),
  requestDate: Joi.date().iso().optional(),
  requiredDate: Joi.date().iso().optional().allow(null),
  reason: Joi.string().trim().max(500).optional().allow("", null),
  notes: Joi.string().trim().max(1000).optional().allow("", null),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const update = Joi.object({
  warehouse: Joi.string().hex().length(24).optional(),
  requiredDate: Joi.date().iso().optional().allow(null),
  reason: Joi.string().trim().max(500).optional().allow("", null),
  notes: Joi.string().trim().max(1000).optional().allow("", null),
  items: Joi.array().items(itemSchema).min(1).optional(),
}).min(1);

const query = Joi.object({
  warehouse: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid("draft","submitted","approved","rejected","cancelled").optional(),
  requestedBy: Joi.string().hex().length(24).optional(),
  search: Joi.string().trim().max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

const reject = Joi.object({
  reason: Joi.string().trim().max(500).required(),
});

module.exports = { create, update, query, reject };
