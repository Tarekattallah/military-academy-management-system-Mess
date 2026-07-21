const reportRepository = require('../repositories/report.repository');

/**
 * Builds a sort object from query params.
 */
function buildSort(sortBy, sortOrder) {
  const order = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: order };
}

/**
 * Builds a date range filter.
 */
function buildDateFilter(startDate, endDate) {
  if (!startDate && !endDate) return {};
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return filter;
}

const reportService = {
  /**
   * Inventory Report — Current Stock view.
   * Supports: warehouse, product, search, quantity range filters.
   */
  async getInventoryReport(query) {
    const { page = 1, limit = 20, sortBy = 'availableQuantity', sortOrder = 'desc', warehouse, product, search, minQuantity, maxQuantity } = query;

    const match = {};

    if (warehouse) match.warehouse = warehouse;
    if (product) match.product = product;
    if (minQuantity !== undefined) match.availableQuantity = { $gte: Number(minQuantity) };
    if (maxQuantity !== undefined) {
      match.availableQuantity = match.availableQuantity || {};
      match.availableQuantity.$lte = Number(maxQuantity);
    }
    const searchRegex = search ? new RegExp(search, 'i') : null;

    const skip = (Number(page) - 1) * Number(limit);
    const sort = buildSort(sortBy, sortOrder);

    return reportRepository.getInventoryReport({ match, sort, skip, limit: Number(limit), searchRegex });
  },

  /**
   * Batch Report — Batch records with remaining days.
   * Supports: product, warehouse, status, expiryFilter, search.
   */
  async getBatchReport(query) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', product, warehouse, status, expiryFilter, search } = query;

    const match = {};

    if (product) match.product = product;
    if (warehouse) match.warehouse = warehouse;
    if (status) match.status = status;

    // Expiry filter
    const now = new Date();
    if (expiryFilter === 'expired') {
      match.expiryDate = { $lt: now };
    } else if (expiryFilter === 'near_expiry') {
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      match.expiryDate = { $gte: now, $lte: thirtyDays };
    } else if (expiryFilter === 'active') {
      match.$or = [
        { expiryDate: { $gte: now } },
        { expiryDate: { $exists: false } },
      ];
    }

    // Search on batchNumber or lotNumber
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      match.$or = match.$or || [];
      match.$or.push(
        { batchNumber: { $regex: searchRegex } },
        { lotNumber: { $regex: searchRegex } },
      );
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = buildSort(sortBy, sortOrder);

    return reportRepository.getBatchReport({ match, sort, skip, limit: Number(limit) });
  },

  /**
   * Receiving Report — Receiving records.
   * Supports: supplier, warehouse, status, date range, search.
   */
  async getReceivingReport(query) {
    const { page = 1, limit = 20, sortBy = 'receivingDate', sortOrder = 'desc', supplier, warehouse, status, search, startDate, endDate } = query;

    const match = {};

    if (supplier) match.supplier = supplier;
    if (warehouse) match.warehouse = warehouse;
    if (status) match.status = status;

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length > 0) {
      match.receivingDate = dateFilter;
    }

    if (search) {
      match.receivingNumber = { $regex: new RegExp(search, 'i') };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = buildSort(sortBy, sortOrder);

    return reportRepository.getReceivingReport({ match, sort, skip, limit: Number(limit) });
  },

  /**
   * Transfer Report — Transfer records.
   * Supports: sourceWarehouse, destinationWarehouse, status, date range, search.
   */
  async getTransferReport(query) {
    const { page = 1, limit = 20, sortBy = 'transferDate', sortOrder = 'desc', sourceWarehouse, destinationWarehouse, status, search, startDate, endDate } = query;

    const match = {};

    if (sourceWarehouse) match.sourceWarehouse = sourceWarehouse;
    if (destinationWarehouse) match.destinationWarehouse = destinationWarehouse;
    if (status) match.status = status;

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length > 0) {
      match.transferDate = dateFilter;
    }

    if (search) {
      match.transferNumber = { $regex: new RegExp(search, 'i') };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = buildSort(sortBy, sortOrder);

    return reportRepository.getTransferReport({ match, sort, skip, limit: Number(limit) });
  },

  /**
   * Waste Report — Waste records.
   * Supports: warehouse, reason, date range, search.
   */
  async getWasteReport(query) {
    const { page = 1, limit = 20, sortBy = 'wasteDate', sortOrder = 'desc', warehouse, reason, search, startDate, endDate } = query;

    const match = {};

    if (warehouse) match.warehouse = warehouse;
    if (reason) match.reason = { $regex: new RegExp(reason, 'i') };

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length > 0) {
      match.wasteDate = dateFilter;
    }

    if (search) {
      match.wasteNumber = { $regex: new RegExp(search, 'i') };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = buildSort(sortBy, sortOrder);

    return reportRepository.getWasteReport({ match, sort, skip, limit: Number(limit) });
  },

  /**
   * Reservation Report — Reservation records.
   * Supports: warehouse, status, date range, search.
   */
  async getReservationReport(query) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', warehouse, status, search, startDate, endDate } = query;

    const match = {};

    if (warehouse) match.warehouse = warehouse;
    if (status) match.status = status;

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length > 0) {
      match.createdAt = dateFilter;
    }

    if (search) {
      match.reservationNumber = { $regex: new RegExp(search, 'i') };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = buildSort(sortBy, sortOrder);

    return reportRepository.getReservationReport({ match, sort, skip, limit: Number(limit) });
  },

  /**
   * Meal Distribution Report — Distribution records.
   * Supports: reservation, mealRequest, status, date range, search.
   */
  async getMealDistributionReport(query) {
    const { page = 1, limit = 20, sortBy = 'distributionDate', sortOrder = 'desc', reservation, mealRequest, status, search, startDate, endDate } = query;

    const match = {};

    if (reservation) match.reservation = reservation;
    if (mealRequest) match.mealRequest = mealRequest;
    if (status) match.status = status;

    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length > 0) {
      match.distributionDate = dateFilter;
    }

    if (search) {
      match.distributionNumber = { $regex: new RegExp(search, 'i') };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = buildSort(sortBy, sortOrder);

    return reportRepository.getMealDistributionReport({ match, sort, skip, limit: Number(limit) });
  },

  /**
   * Consumption Report — Aggregated inventory transactions of type 'issue'.
   * Supports: product, warehouse, period (daily/weekly/monthly), date range.
   */
  async getConsumptionReport(query) {
    const { page = 1, limit = 20, sortBy = 'totalConsumed', sortOrder = 'desc', product, warehouse, period = 'monthly', startDate, endDate } = query;

    const match = { transactionType: 'issue' };

    if (product) match.product = product;
    if (warehouse) match.warehouse = warehouse;

    // Build date range for the $match stage
    const dateFilter = buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length > 0) {
      match.transactionDate = dateFilter;
    }

    // Build the $group _id based on period
    let dateTrunc;
    switch (period) {
      case 'daily':
        dateTrunc = {
          $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' },
        };
        break;
      case 'weekly':
        dateTrunc = {
          $dateToString: { format: '%Y-W%V', date: '$transactionDate' },
        };
        break;
      case 'monthly':
        dateTrunc = {
          $dateToString: { format: '%Y-%m', date: '$transactionDate' },
        };
        break;
      case 'custom':
        dateTrunc = {
          $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' },
        };
        break;
      default:
        dateTrunc = {
          $dateToString: { format: '%Y-%m', date: '$transactionDate' },
        };
    }

    const groupId = {
      product: '$product',
      warehouse: '$warehouse',
      period: dateTrunc,
    };

    const skip = (Number(page) - 1) * Number(limit);
    const sort = buildSort(sortBy, sortOrder);

    return reportRepository.getConsumptionReport({ match, groupId, sort, skip, limit: Number(limit) });
  },
};

module.exports = reportService;
