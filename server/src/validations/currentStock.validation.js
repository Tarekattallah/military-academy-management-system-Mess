const Joi = require('joi');

const query = Joi.object({
  product: Joi.string().hex().length(24).optional(),
  warehouse: Joi.string().hex().length(24).optional(),
  lowStock: Joi.number().integer().min(0).optional(),
  expiringSoon: Joi.number().integer().min(0).optional(),
});

module.exports = { query };
