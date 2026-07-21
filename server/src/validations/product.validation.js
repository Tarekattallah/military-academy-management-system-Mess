const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).optional().allow('', null),
  category: Joi.string().hex().length(24).required(),
  unit: Joi.string().hex().length(24).required(),
  unitPrice: Joi.number().min(0).optional().default(0),
  taxRate: Joi.number().min(0).max(100).optional().default(0),
  supplier: Joi.string().hex().length(24).optional().allow(null),
  minStockLevel: Joi.number().min(0).optional().default(0),
  maxStockLevel: Joi.number().min(0).optional(),
  sku: Joi.string().trim().max(50).optional().allow('', null),
  barcode: Joi.string().trim().max(100).optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const update = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(1000).optional().allow('', null),
  category: Joi.string().hex().length(24).optional(),
  unit: Joi.string().hex().length(24).optional(),
  unitPrice: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  supplier: Joi.string().hex().length(24).optional().allow(null),
  minStockLevel: Joi.number().min(0).optional(),
  maxStockLevel: Joi.number().min(0).optional(),
  sku: Joi.string().trim().max(50).optional().allow('', null),
  barcode: Joi.string().trim().max(100).optional().allow('', null),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { create, update };
