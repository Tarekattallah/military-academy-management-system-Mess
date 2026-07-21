const Joi = require('joi');

const dashboardValidation = {
  // Dashboard endpoints are read-only with no required query parameters.
  // These schemas are defined for consistency and future extensibility.
  query: Joi.object({
    // No filters currently required for dashboard endpoints
  }),
};

module.exports = dashboardValidation;
