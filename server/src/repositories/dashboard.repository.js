const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const Supplier = require('../models/supplier.model');
const Recipe = require('../models/recipe.model');
const Menu = require('../models/menu.model');
const Reservation = require('../models/reservation.model');
const MealDistribution = require('../models/mealDistribution.model');
const CurrentStock = require('../models/currentStock.model');
const Batch = require('../models/batch.model');
const Receiving = require('../models/receiving.model');
const Transfer = require('../models/transfer.model');
const Waste = require('../models/waste.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');

const dashboardRepository = {
  // ── Summary Queries ──────────────────────────────────────────────────────

  async getTotalProducts() {
    return Product.countDocuments({ isActive: true });
  },

  async getTotalWarehouses() {
    return Warehouse.countDocuments({ isActive: true });
  },

  async getTotalSuppliers() {
    return Supplier.countDocuments({ isActive: true });
  },

  async getTotalRecipes() {
    return Recipe.countDocuments({ status: 'active' });
  },

  async getTotalMenus() {
    return Menu.countDocuments();
  },

  async getTotalReservations() {
    return Reservation.countDocuments();
  },

  async getTotalMealDistributions() {
    return MealDistribution.countDocuments();
  },

  async getTotalCurrentStock() {
    return CurrentStock.countDocuments();
  },

  async getTotalInventoryValue() {
    const result = await CurrentStock.aggregate([
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ['$availableQuantity', '$weightedAverageCost'] },
          },
        },
      },
    ]);
    return result.length > 0 ? result[0].totalValue : 0;
  },

  // ── Inventory Overview ───────────────────────────────────────────────────

  async getLowStockCount() {
    // Low stock: availableQuantity > 0 but less than minStockLevel
    const result = await CurrentStock.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $match: {
          $expr: {
            $and: [
              { $gt: ['$availableQuantity', 0] },
              { $lt: ['$availableQuantity', '$product.minStockLevel'] },
            ],
          },
        },
      },
      { $count: 'count' },
    ]);
    return result.length > 0 ? result[0].count : 0;
  },

  async getOutOfStockCount() {
    const result = await CurrentStock.aggregate([
      { $match: { availableQuantity: 0 } },
      { $count: 'count' },
    ]);
    return result.length > 0 ? result[0].count : 0;
  },

  async getExpiredBatchCount() {
    return Batch.countDocuments({ status: 'expired' });
  },

  async getNearExpiryBatchCount() {
    // Near expiry: active batches expiring within 30 days
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return Batch.countDocuments({
      status: 'active',
      expiryDate: { $gte: now, $lte: thirtyDaysLater },
    });
  },

  async getTotalBatchCount() {
    return Batch.countDocuments();
  },

  // ── Operations Today ─────────────────────────────────────────────────────

  async getReceivingsToday(startOfDay, endOfDay) {
    return Receiving.countDocuments({
      receivingDate: { $gte: startOfDay, $lte: endOfDay },
    });
  },

  async getTransfersToday(startOfDay, endOfDay) {
    return Transfer.countDocuments({
      transferDate: { $gte: startOfDay, $lte: endOfDay },
    });
  },

  async getWasteRecordsToday(startOfDay, endOfDay) {
    return Waste.countDocuments({
      wasteDate: { $gte: startOfDay, $lte: endOfDay },
    });
  },

  async getReservationsToday(startOfDay, endOfDay) {
    return Reservation.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
  },

  async getMealDistributionsToday(startOfDay, endOfDay) {
    return MealDistribution.countDocuments({
      distributionDate: { $gte: startOfDay, $lte: endOfDay },
    });
  },

  // ── Consumption Analytics ────────────────────────────────────────────────

  async getTopConsumedProducts(limit = 10) {
    return InventoryTransaction.aggregate([
      { $match: { transactionType: 'issue' } },
      {
        $group: {
          _id: '$product',
          totalConsumed: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
        },
      },
      { $sort: { totalConsumed: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$product.name',
          productSku: '$product.sku',
          totalConsumed: 1,
          totalCost: 1,
        },
      },
    ]);
  },

  async getTopRecipes(limit = 10) {
    // Top recipes based on distribution data (recipe snapshots)
    return MealDistribution.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$recipeSnapshots' },
      { $unwind: '$recipeSnapshots.ingredients' },
      {
        $group: {
          _id: '$recipeSnapshots.recipe',
          recipeName: { $first: '$recipeSnapshots.recipeName' },
          recipeNumber: { $first: '$recipeSnapshots.recipeNumber' },
          totalDistributed: { $sum: 1 },
          totalIngredientsUsed: { $sum: '$recipeSnapshots.ingredients.quantity' },
        },
      },
      { $sort: { totalDistributed: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          recipeId: '$_id',
          recipeName: 1,
          recipeNumber: 1,
          totalDistributed: 1,
          totalIngredientsUsed: 1,
        },
      },
    ]);
  },

  async getTotalConsumptionToday(startOfDay, endOfDay) {
    const result = await InventoryTransaction.aggregate([
      {
        $match: {
          transactionType: 'issue',
          transactionDate: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
        },
      },
    ]);
    return result.length > 0
      ? { totalQuantity: result[0].totalQuantity, totalCost: result[0].totalCost }
      : { totalQuantity: 0, totalCost: 0 };
  },

  async getTotalConsumptionThisMonth(startOfMonth, endOfMonth) {
    const result = await InventoryTransaction.aggregate([
      {
        $match: {
          transactionType: 'issue',
          transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
        },
      },
    ]);
    return result.length > 0
      ? { totalQuantity: result[0].totalQuantity, totalCost: result[0].totalCost }
      : { totalQuantity: 0, totalCost: 0 };
  },

  // ── Waste Analytics ──────────────────────────────────────────────────────

  async getTotalWasteToday(startOfDay, endOfDay) {
    const result = await Waste.aggregate([
      {
        $match: {
          wasteDate: { $gte: startOfDay, $lte: endOfDay },
          status: 'completed',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
    ]);
    return result.length > 0 ? result[0].totalQuantity : 0;
  },

  async getTotalWasteThisMonth(startOfMonth, endOfMonth) {
    const result = await Waste.aggregate([
      {
        $match: {
          wasteDate: { $gte: startOfMonth, $lte: endOfMonth },
          status: 'completed',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
    ]);
    return result.length > 0 ? result[0].totalQuantity : 0;
  },

  async getTopWastedProducts(limit = 10) {
    return Waste.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalWasted: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalWasted: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$product.name',
          productSku: '$product.sku',
          totalWasted: 1,
        },
      },
    ]);
  },

  // ── Reservation Analytics ────────────────────────────────────────────────

  async getReservationStatusCounts() {
    return Reservation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  },

  // ── Distribution Analytics ───────────────────────────────────────────────

  async getDistributionStatusCounts() {
    return MealDistribution.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  },

  // ── Warehouse Statistics ─────────────────────────────────────────────────

  async getWarehouseStatistics() {
    return Warehouse.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'currentstocks',
          let: { warehouseId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$warehouse', '$$warehouseId'] } } },
            {
              $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'productInfo',
              },
            },
            { $unwind: '$productInfo' },
          ],
          as: 'stocks',
        },
      },
      {
        $project: {
          _id: 1,
          name: '$name',
          totalProducts: { $size: { $ifNull: ['$stocks', []] } },
          totalQuantity: { $sum: { $ifNull: ['$stocks.availableQuantity', 0] } },
          totalValue: {
            $sum: {
              $map: {
                input: { $ifNull: ['$stocks', []] },
                as: 's',
                in: {
                  $multiply: [
                    { $ifNull: ['$$s.availableQuantity', 0] },
                    { $ifNull: ['$$s.weightedAverageCost', 0] },
                  ],
                },
              },
            },
          },
          lowStockItems: {
            $sum: {
              $map: {
                input: { $ifNull: ['$stocks', []] },
                as: 's',
                in: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ['$$s.availableQuantity', 0] },
                        {
                          $lt: [
                            '$$s.availableQuantity',
                            { $ifNull: ['$$s.productInfo.minStockLevel', 0] },
                          ],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);
  },
};

module.exports = dashboardRepository;
