const dashboardRepository = require('../repositories/dashboard.repository');

const dashboardService = {
  /**
   * Dashboard Summary
   * Returns aggregate counts across all major entities.
   */
  async getSummary() {
    const [
      totalProducts,
      totalWarehouses,
      totalSuppliers,
      totalRecipes,
      totalMenus,
      totalReservations,
      totalMealDistributions,
      totalCurrentStock,
      totalInventoryValue,
    ] = await Promise.all([
      dashboardRepository.getTotalProducts(),
      dashboardRepository.getTotalWarehouses(),
      dashboardRepository.getTotalSuppliers(),
      dashboardRepository.getTotalRecipes(),
      dashboardRepository.getTotalMenus(),
      dashboardRepository.getTotalReservations(),
      dashboardRepository.getTotalMealDistributions(),
      dashboardRepository.getTotalCurrentStock(),
      dashboardRepository.getTotalInventoryValue(),
    ]);

    return {
      totalProducts,
      totalWarehouses,
      totalSuppliers,
      totalRecipes,
      totalMenus,
      totalReservations,
      totalMealDistributions,
      totalCurrentStock,
      totalInventoryValue,
    };
  },

  /**
   * Inventory Overview
   * Returns counts for low stock, out of stock, expired, near expiry, and total batches.
   */
  async getInventoryOverview() {
    const [
      lowStockCount,
      outOfStockCount,
      expiredBatchCount,
      nearExpiryBatchCount,
      totalBatchCount,
    ] = await Promise.all([
      dashboardRepository.getLowStockCount(),
      dashboardRepository.getOutOfStockCount(),
      dashboardRepository.getExpiredBatchCount(),
      dashboardRepository.getNearExpiryBatchCount(),
      dashboardRepository.getTotalBatchCount(),
    ]);

    return {
      lowStockCount,
      outOfStockCount,
      expiredBatchCount,
      nearExpiryBatchCount,
      totalBatchCount,
    };
  },

  /**
   * Operations Today
   * Returns counts of operations performed today.
   */
  async getTodayOperations() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const [
      receivingsToday,
      transfersToday,
      wasteRecordsToday,
      reservationsToday,
      mealDistributionsToday,
    ] = await Promise.all([
      dashboardRepository.getReceivingsToday(startOfDay, endOfDay),
      dashboardRepository.getTransfersToday(startOfDay, endOfDay),
      dashboardRepository.getWasteRecordsToday(startOfDay, endOfDay),
      dashboardRepository.getReservationsToday(startOfDay, endOfDay),
      dashboardRepository.getMealDistributionsToday(startOfDay, endOfDay),
    ]);

    return {
      receivingsToday,
      transfersToday,
      wasteRecordsToday,
      reservationsToday,
      mealDistributionsToday,
    };
  },

  /**
   * Consumption Analytics
   * Returns top consumed products, top recipes, and consumption totals.
   */
  async getConsumptionAnalytics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [topConsumedProducts, topRecipes, consumptionToday, consumptionThisMonth] =
      await Promise.all([
        dashboardRepository.getTopConsumedProducts(10),
        dashboardRepository.getTopRecipes(10),
        dashboardRepository.getTotalConsumptionToday(startOfDay, endOfDay),
        dashboardRepository.getTotalConsumptionThisMonth(startOfMonth, endOfMonth),
      ]);

    return {
      topConsumedProducts,
      topRecipes,
      totalConsumptionToday: consumptionToday,
      totalConsumptionThisMonth: consumptionThisMonth,
    };
  },

  /**
   * Waste Analytics
   * Returns total waste today, this month, and top wasted products.
   */
  async getWasteAnalytics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [totalWasteToday, totalWasteThisMonth, topWastedProducts] = await Promise.all([
      dashboardRepository.getTotalWasteToday(startOfDay, endOfDay),
      dashboardRepository.getTotalWasteThisMonth(startOfMonth, endOfMonth),
      dashboardRepository.getTopWastedProducts(10),
    ]);

    return {
      totalWasteToday,
      totalWasteThisMonth,
      topWastedProducts,
    };
  },

  /**
   * Reservation Analytics
   * Returns counts grouped by reservation status.
   */
  async getReservationAnalytics() {
    const statusCounts = await dashboardRepository.getReservationStatusCounts();

    // Transform array into a map with default 0 values
    const result = {
      draft: 0,
      reserved: 0,
      consumed: 0,
      released: 0,
      cancelled: 0,
    };

    // Map database statuses to expected output keys
    const statusMap = {
      draft: 'draft',
      reserved: 'reserved',
      consumed: 'consumed',
      released: 'released',
      cancelled: 'cancelled',
    };

    for (const item of statusCounts) {
      const key = statusMap[item._id];
      if (key) {
        result[key] = item.count;
      }
    }

    return result;
  },

  /**
   * Distribution Analytics
   * Returns counts grouped by distribution status.
   */
  async getDistributionAnalytics() {
    const statusCounts = await dashboardRepository.getDistributionStatusCounts();

    const result = {
      draft: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    };

    const statusMap = {
      draft: 'draft',
      in_progress: 'inProgress',
      completed: 'completed',
      cancelled: 'cancelled',
    };

    for (const item of statusCounts) {
      const key = statusMap[item._id];
      if (key) {
        result[key] = item.count;
      }
    }

    return result;
  },

  /**
   * Warehouse Statistics
   * Returns per-warehouse product count, batch count, current stock, and reservation count.
   */
  async getWarehouseStatistics() {
    return dashboardRepository.getWarehouseStatistics();
  },
};

module.exports = dashboardService;
