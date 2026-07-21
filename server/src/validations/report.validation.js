const Joi = require('joi');

const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  sortBy: Joi.string().trim().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
};

const dateRangeSchema = {
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
};

const inventoryReportQuery = Joi.object({
  ...paginationSchema,
  ...dateRangeSchema,
  warehouse: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  product: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  search: Joi.string().trim().allow(''),
  minQuantity: Joi.number().min(0),
  maxQuantity: Joi.number().min(0),
});

const batchReportQuery = Joi.object({
  ...paginationSchema,
  ...dateRangeSchema,
  product: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  warehouse: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid('active', 'depleted', 'expired', 'quarantined', 'archived'),
  search: Joi.string().trim().allow(''),
  expiryFilter: Joi.string().valid('expired', 'near_expiry', 'active'),
});

const receivingReportQuery = Joi.object({
  ...paginationSchema,
  ...dateRangeSchema,
  supplier: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  warehouse: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid('draft', 'completed', 'cancelled'),
  search: Joi.string().trim().allow(''),
});

const transferReportQuery = Joi.object({
  ...paginationSchema,
  ...dateRangeSchema,
  sourceWarehouse: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  destinationWarehouse: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid('draft', 'completed', 'cancelled'),
  search: Joi.string().trim().allow(''),
});

const wasteReportQuery = Joi.object({
  ...paginationSchema,
  ...dateRangeSchema,
  warehouse: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  reason: Joi.string().trim().allow(''),
  search: Joi.string().trim().allow(''),
});

const reservationReportQuery = Joi.object({
  ...paginationSchema,
  ...dateRangeSchema,
  warehouse: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid('draft', 'reserved', 'released', 'consumed'),
  search: Joi.string().trim().allow(''),
});

const mealDistributionReportQuery = Joi.object({
  ...paginationSchema,
  ...dateRangeSchema,
  reservation: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  mealRequest: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid('draft', 'in_progress', 'completed', 'cancelled'),
  search: Joi.string().trim().allow(''),
});

const consumptionReportQuery = Joi.object({
  ...paginationSchema,
  ...dateRangeSchema,
  product: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  warehouse: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  period: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').default('monthly'),
});

module.exports = {
  inventoryReportQuery,
  batchReportQuery,
  receivingReportQuery,
  transferReportQuery,
  wasteReportQuery,
  reservationReportQuery,
  mealDistributionReportQuery,
  consumptionReportQuery,
};
