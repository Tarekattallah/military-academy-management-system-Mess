const Joi = require('joi');

const create = Joi.object({
  reservation: Joi.string().hex().length(24).required(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const complete = Joi.object({
  actualServings: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Actual servings cannot be negative',
  }),
  items: Joi.array()
    .items(
      Joi.object({
        batch: Joi.string().hex().length(24).required(),
        product: Joi.string().hex().length(24).required(),
        issuedQuantity: Joi.number().min(0).optional(),
        actualQuantity: Joi.number().min(0).required(),
        wastageQuantity: Joi.number().min(0).default(0),
        returnedQuantity: Joi.number().min(0).default(0),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one distribution item is required',
    }),
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const cancel = Joi.object({
  reason: Joi.string().trim().max(500).required().messages({
    'string.empty': 'Cancellation reason is required',
  }),
});

const statusUpdate = Joi.object({
  status: Joi.string().valid('draft', 'in_progress', 'completed', 'cancelled').required(),
});

const query = Joi.object({
  status: Joi.string().valid('draft', 'in_progress', 'completed', 'cancelled').optional(),
  reservation: Joi.string().hex().length(24).optional(),
  mealRequest: Joi.string().hex().length(24).optional(),
  search: Joi.string().trim().optional(),
});

module.exports = { create, complete, cancel, statusUpdate, query };
