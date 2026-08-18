const Joi = require("joi");

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().hex().length(24).required(),
  unitPrice: Joi.number().min(0).required(),
  notes: Joi.string().trim().max(300).optional().allow("", null),
});

const create = Joi.object({
  purchaseRequest: Joi.string().hex().length(24).optional().allow(null),
  supplier: Joi.string().hex().length(24).required(),
  warehouse: Joi.string().hex().length(24).required(),
  orderDate: Joi.date().iso().optional(),
  expectedDeliveryDate: Joi.date().iso().optional().allow(null),
  notes: Joi.string().trim().max(1000).optional().allow("", null),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const update = Joi.object({
  purchaseRequest: Joi.string().hex().length(24).optional().allow(null),
  supplier: Joi.string().hex().length(24).optional(),
  warehouse: Joi.string().hex().length(24).optional(),
  expectedDeliveryDate: Joi.date().iso().optional().allow(null),
  notes: Joi.string().trim().max(1000).optional().allow("", null),
  items: Joi.array().items(itemSchema).min(1).optional(),
}).min(1);

const query = Joi.object({
  supplier: Joi.string().hex().length(24).optional(),
  warehouse: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid("draft","submitted","approved","rejected","partially_received","fully_received","cancelled").optional(),
  search: Joi.string().trim().max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

const reject = Joi.object({
  reason: Joi.string().trim().max(500).required(),
});

module.exports = { create, update, query, reject };
