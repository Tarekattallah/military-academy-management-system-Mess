const Joi = require('joi');

const transactionTypes = [
  'receiving',
  'transfer_out',
  'transfer_in',
  'return',
  'waste',
  'adjustment',
  'issue',
  'reservation',
  'reservation_cancel',
];

const modules = [
  'receiving',
  'transfers',
  'returns',
  'waste',
  'stock-count',
  'meal-issue',
  'manual',
];

const create = Joi.object({
  batch: Joi.string().hex().length(24).required(),
  product: Joi.string().hex().length(24).required(),
  warehouse: Joi.string().hex().length(24).required(),
  transactionType: Joi.string().valid(...transactionTypes).required(),
  module: Joi.string().valid(...modules).optional(), // auto-detected if omitted
  quantity: Joi.number().positive().required(),
  unitCost: Joi.number().min(0).optional(),
  referenceType: Joi.string().trim().max(100).optional().allow('', null),
  referenceId: Joi.string().hex().length(24).optional().allow(null),
  reason: Joi.string().trim().max(500).optional().allow('', null),
  performedBy: Joi.string().hex().length(24).required(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  currentQuantity: Joi.number().min(0).optional(),
});

const query = Joi.object({
  batch: Joi.string().hex().length(24).optional(),
  product: Joi.string().hex().length(24).optional(),
  warehouse: Joi.string().hex().length(24).optional(),
  transactionType: Joi.string().valid(...transactionTypes).optional(),
  module: Joi.string().valid(...modules).optional(),
  referenceType: Joi.string().trim().max(100).optional(),
  referenceId: Joi.string().hex().length(24).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

module.exports = { create, query };
