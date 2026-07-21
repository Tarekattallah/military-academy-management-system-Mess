const currentStockRepository = require('../repositories/currentStock.repository');
const Batch = require('../models/batch.model');
const AppError = require('../utils/AppError');

const currentStockService = {
  /**
   * Updates CurrentStock for a product+warehouse after an inventory transaction.
   *
   * This is the ONLY way CurrentStock gets updated. It is called by
   * inventoryTransactionService.create() after the transaction and batch
   * update succeed within the same MongoDB session.
   *
   * @param {string} productId - Product ID
   * @param {string} warehouseId - Warehouse ID
   * @param {Object} [session] - MongoDB session for atomicity
   */
  async updateFromTransaction(productId, warehouseId, session) {
    // Aggregate all batches for this product+warehouse
    const aggregation = await Batch.aggregate([
      { $match: { product: new (require('mongoose').Types.ObjectId)(productId), warehouse: new (require('mongoose').Types.ObjectId)(warehouseId) } },
      {
        $group: {
          _id: null,
          batchCount: { $sum: 1 },
          totalQuantity: { $sum: '$initialQuantity' },
          reservedQuantity: { $sum: '$reservedQuantity' },
          availableQuantity: { $sum: '$availableQuantity' },
          totalCost: { $sum: { $multiply: ['$availableQuantity', '$unitCost'] } },
          totalAvailable: { $sum: '$availableQuantity' },
          lastExpiryDate: { $max: '$expiryDate' },
        },
      },
    ]);

    if (aggregation.length === 0) {
      // No batches exist for this product+warehouse — set everything to 0
      return currentStockRepository.upsert(productId, warehouseId, {
        batchCount: 0,
        totalQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        weightedAverageCost: 0,
        lastExpiryDate: null,
        lastTransactionDate: new Date(),
      }, session);
    }

    const data = aggregation[0];
    const weightedAverageCost = data.totalAvailable > 0
      ? Math.round((data.totalCost / data.totalAvailable) * 100) / 100
      : 0;

    return currentStockRepository.upsert(productId, warehouseId, {
      batchCount: data.batchCount,
      totalQuantity: data.totalQuantity,
      reservedQuantity: data.reservedQuantity,
      availableQuantity: data.availableQuantity,
      weightedAverageCost,
      lastExpiryDate: data.lastExpiryDate || null,
      lastTransactionDate: new Date(),
    }, session);
  },

  /**
   * Full refresh of CurrentStock from scratch for all product+warehouse combinations.
   * Useful for data repair or initial seed.
   */
  async refreshAll() {
    const aggregation = await Batch.aggregate([
      {
        $group: {
          _id: { product: '$product', warehouse: '$warehouse' },
          batchCount: { $sum: 1 },
          totalQuantity: { $sum: '$initialQuantity' },
          reservedQuantity: { $sum: '$reservedQuantity' },
          availableQuantity: { $sum: '$availableQuantity' },
          totalCost: { $sum: { $multiply: ['$availableQuantity', '$unitCost'] } },
          totalAvailable: { $sum: '$availableQuantity' },
          lastExpiryDate: { $max: '$expiryDate' },
        },
      },
    ]);

    const results = [];
    for (const item of aggregation) {
      const weightedAverageCost = item.totalAvailable > 0
        ? Math.round((item.totalCost / item.totalAvailable) * 100) / 100
        : 0;

      const stock = await currentStockRepository.upsert(
        item._id.product,
        item._id.warehouse,
        {
          batchCount: item.batchCount,
          totalQuantity: item.totalQuantity,
          reservedQuantity: item.reservedQuantity,
          availableQuantity: item.availableQuantity,
          weightedAverageCost,
          lastExpiryDate: item.lastExpiryDate || null,
          lastTransactionDate: new Date(),
        }
      );
      results.push(stock);
    }

    return results;
  },

  /**
   * Lists current stock records with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.product) filter.product = query.product;
    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.lowStock !== undefined) {
      // e.g., lowStock=10 means availableQuantity < 10
      filter.availableQuantity = { $lt: Number(query.lowStock) };
    }
    if (query.expiringSoon !== undefined) {
      // e.g., expiringSoon=30 means lastExpiryDate within 30 days
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + Number(query.expiringSoon));
      filter.lastExpiryDate = { $lte: threshold, $ne: null };
    }

    return currentStockRepository.findAll(filter);
  },

  /**
   * Gets a single current stock record by product and warehouse.
   */
  async getByProductAndWarehouse(productId, warehouseId) {
    const stock = await currentStockRepository.findByProductAndWarehouse(productId, warehouseId);
    if (!stock) {
      // Return empty record instead of 404 — stock may be zero
      return {
        product: productId,
        warehouse: warehouseId,
        batchCount: 0,
        totalQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        weightedAverageCost: 0,
        lastExpiryDate: null,
        lastTransactionDate: null,
      };
    }
    return stock;
  },

  /**
   * Gets a single current stock record by ID.
   */
  async getById(id) {
    const stock = await currentStockRepository.findById(id);
    if (!stock) throw new AppError('Current stock record not found', 404);
    return stock;
  },
};

module.exports = currentStockService;
