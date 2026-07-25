const Joi = require('joi');

const update = Joi.object({
  appName: Joi.string().trim().max(100).optional(),
  unitCode: Joi.string().trim().max(50).optional(),
  language: Joi.string().valid('ar', 'en').optional(),
});

module.exports = { update };
