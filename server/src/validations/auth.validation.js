const Joi = require('joi');

const login = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().required(),
});

const register = Joi.object({
  username: Joi.string().trim().lowercase().min(3).max(50).required(),
  email: Joi.string().trim().lowercase().email().optional().allow('', null),
  displayName: Joi.string().trim().min(2).max(100).required(),
  password: Joi.string().min(6).required(),
  roles: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

module.exports = { login, register };
