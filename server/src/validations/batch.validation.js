const Joi = require('joi');

const create = Joi.object({
  product: Joi.string().hex().length(24).required(),
  warehouse: Joi.string().hex().length(24).required(),
  batchNumber: Joi.string().trim().max(100).required(),
  lotNumber: Joi.string().trim().max(100).optional().allow('', null),
  manufacturingDate: Joi.date().iso().optional().allow(null),
  expiryDate: Joi.date().iso().optional().allow(null),
  initialQuantity: Joi.number().integer().min(0).required(),
  unitCost: Joi.number().min(0).optional().default(0),
  supplier: Joi.string().hex().length(24).optional().allow(null),
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const update = Joi.object({
  lotNumber: Joi.string().trim().max(100).optional().allow('', null),
  manufacturingDate: Joi.date().iso().optional().allow(null),
  expiryDate: Joi.date().iso().optional().allow(null),
  unitCost: Joi.number().min(0).optional(),
  supplier: Joi.string().hex().length(24).optional().allow(null),
  status: Joi.string().valid('active', 'depleted', 'expired', 'quarantined', 'archived').optional(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
}).min(1);

const query = Joi.object({
  product: Joi.string().hex().length(24).optional(),
  warehouse: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('active', 'depleted', 'expired', 'quarantined', 'archived').optional(),
  search: Joi.string().trim().max(100).optional(),
});

module.exports = { create, update, query };
