const AppError = require('../utils/AppError');

// Usage: validate(userValidation.create)             // validates req.body
// Usage: validate(userValidation.query, 'query')      // validates req.query
// Usage: validate(userValidation.params, 'params')    // validates req.params
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new AppError(message, 422));
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;
