const CurrentStock = require('../models/currentStock.model');
const Batch = require('../models/batch.model');
const Receiving = require('../models/receiving.model');
const Transfer = require('../models/transfer.model');
const Waste = require('../models/waste.model');
const Reservation = require('../models/reservation.model');
const MealDistribution = require('../models/mealDistribution.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');

const reportRepository = {
  /**
   * Inventory Report — Current Stock aggregated with product/warehouse info.
   * Returns availableQuantity, totalQuantity, reservedQuantity per product+warehouse.
   */
  async getInventoryReport({ match, sort, skip, limit, searchRegex }) {
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
      ...(searchRegex
        ? [{ $match: { $or: [{ 'product.name': searchRegex }, { 'product.sku': searchRegex }] } }]
        : []),
      {
        $project: {
          _id: 1,
          productId: '$product._id',
          productName: '$product.name',
          productSku: '$product.sku',
          warehouseId: '$warehouse._id',
          warehouseName: '$warehouse.name',
          warehouseCode: '$warehouse.code',
          totalQuantity: 1,
          reservedQuantity: 1,
          availableQuantity: 1,
          batchCount: 1,
          weightedAverageCost: 1,
          lastExpiryDate: 1,
          lastTransactionDate: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: match },
      ...(searchRegex
        ? [
            {
              $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'product',
              },
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            { $match: { $or: [{ 'product.name': searchRegex }, { 'product.sku': searchRegex }] } },
          ]
        : []),
      { $count: 'total' },
    ];

    const [data, countResult] = await Promise.all([
      CurrentStock.aggregate(pipeline).allowDiskUse(true),
      CurrentStock.aggregate(countPipeline).allowDiskUse(true),
    ]);

    return {
      data,
      total: countResult.length > 0 ? countResult[0].total : 0,
    };
  },

  /**
   * Batch Report — Batch records with product/warehouse info and remaining days calculation.
   */
  async getBatchReport({ match, sort, skip, limit }) {
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          remainingDays: {
            $cond: {
              if: { $ifNull: ['$expiryDate', false] },
              then: {
                $ceil: {
                  $divide: [
                    { $subtract: ['$expiryDate', '$$NOW'] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          batchNumber: 1,
          productId: '$product._id',
          productName: '$product.name',
          productSku: '$product.sku',
          warehouseId: '$warehouse._id',
          warehouseName: '$warehouse.name',
          warehouseCode: '$warehouse.code',
          initialQuantity: 1,
          availableQuantity: 1,
          reservedQuantity: 1,
          unitCost: 1,
          manufacturingDate: 1,
          expiryDate: 1,
          remainingDays: 1,
          status: 1,
          lotNumber: 1,
          supplier: 1,
          createdAt: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: match },
      { $count: 'total' },
    ];

    const [data, countResult] = await Promise.all([
      Batch.aggregate(pipeline).allowDiskUse(true),
      Batch.aggregate(countPipeline).allowDiskUse(true),
    ]);

    return {
      data,
      total: countResult.length > 0 ? countResult[0].total : 0,
    };
  },

  /**
   * Receiving Report — Receiving records with supplier/warehouse info.
   */
  async getReceivingReport({ match, sort, skip, limit }) {
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          receivingNumber: 1,
          supplierId: '$supplier._id',
          supplierName: '$supplier.name',
          warehouseId: '$warehouse._id',
          warehouseName: '$warehouse.name',
          warehouseCode: '$warehouse.code',
          receivingDate: 1,
          status: 1,
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                product: '$$item.product',
                batchNumber: '$$item.batchNumber',
                quantity: '$$item.quantity',
                unitCost: '$$item.unitCost',
                expiryDate: '$$item.expiryDate',
              },
            },
          },
          notes: 1,
          createdBy: 1,
          createdAt: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: match },
      { $count: 'total' },
    ];

    const [data, countResult] = await Promise.all([
      Receiving.aggregate(pipeline).allowDiskUse(true),
      Receiving.aggregate(countPipeline).allowDiskUse(true),
    ]);

    return {
      data,
      total: countResult.length > 0 ? countResult[0].total : 0,
    };
  },

  /**
   * Transfer Report — Transfer records with source/destination warehouse info.
   */
  async getTransferReport({ match, sort, skip, limit }) {
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'sourceWarehouse',
          foreignField: '_id',
          as: 'sourceWarehouse',
        },
      },
      { $unwind: { path: '$sourceWarehouse', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'destinationWarehouse',
          foreignField: '_id',
          as: 'destinationWarehouse',
        },
      },
      { $unwind: { path: '$destinationWarehouse', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          transferNumber: 1,
          sourceWarehouseId: '$sourceWarehouse._id',
          sourceWarehouseName: '$sourceWarehouse.name',
          sourceWarehouseCode: '$sourceWarehouse.code',
          destinationWarehouseId: '$destinationWarehouse._id',
          destinationWarehouseName: '$destinationWarehouse.name',
          destinationWarehouseCode: '$destinationWarehouse.code',
          transferDate: 1,
          status: 1,
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                product: '$$item.product',
                sourceBatch: '$$item.sourceBatch',
                destinationBatchNumber: '$$item.destinationBatchNumber',
                quantity: '$$item.quantity',
                unitCost: '$$item.unitCost',
              },
            },
          },
          notes: 1,
          createdBy: 1,
          createdAt: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: match },
      { $count: 'total' },
    ];

    const [data, countResult] = await Promise.all([
      Transfer.aggregate(pipeline).allowDiskUse(true),
      Transfer.aggregate(countPipeline).allowDiskUse(true),
    ]);

    return {
      data,
      total: countResult.length > 0 ? countResult[0].total : 0,
    };
  },

  /**
   * Waste Report — Waste records with product/warehouse info.
   */
  async getWasteReport({ match, sort, skip, limit }) {
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
      {
        $unwind: { path: '$items', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          wasteNumber: { $first: '$wasteNumber' },
          warehouseId: { $first: '$warehouse._id' },
          warehouseName: { $first: '$warehouse.name' },
          warehouseCode: { $first: '$warehouse.code' },
          wasteDate: { $first: '$wasteDate' },
          reason: { $first: '$reason' },
          status: { $first: '$status' },
          notes: { $first: '$notes' },
          createdBy: { $first: '$createdBy' },
          createdAt: { $first: '$createdAt' },
          items: {
            $push: {
              productId: '$product._id',
              productName: '$product.name',
              productSku: '$product.sku',
              batch: '$items.batch',
              quantity: '$items.quantity',
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          wasteNumber: 1,
          warehouseId: 1,
          warehouseName: 1,
          warehouseCode: 1,
          wasteDate: 1,
          reason: 1,
          status: 1,
          notes: 1,
          createdBy: 1,
          createdAt: 1,
          items: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: match },
      { $count: 'total' },
    ];

    const [data, countResult] = await Promise.all([
      Waste.aggregate(pipeline).allowDiskUse(true),
      Waste.aggregate(countPipeline).allowDiskUse(true),
    ]);

    return {
      data,
      total: countResult.length > 0 ? countResult[0].total : 0,
    };
  },

  /**
   * Reservation Report — Reservation records with mealRequest/warehouse info.
   */
  async getReservationReport({ match, sort, skip, limit }) {
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'mealrequests',
          localField: 'mealRequest',
          foreignField: '_id',
          as: 'mealRequest',
        },
      },
      { $unwind: { path: '$mealRequest', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          reservationNumber: 1,
          mealRequestId: '$mealRequest._id',
          mealRequestNumber: '$mealRequest.requestNumber',
          warehouseId: '$warehouse._id',
          warehouseName: '$warehouse.name',
          warehouseCode: '$warehouse.code',
          requestingUnit: 1,
          menu: 1,
          status: 1,
          reservedBy: 1,
          reservedAt: 1,
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                recipe: '$$item.recipe',
                product: '$$item.product',
                batch: '$$item.batch',
                reservedQuantity: '$$item.reservedQuantity',
                consumedQuantity: '$$item.consumedQuantity',
              },
            },
          },
          notes: 1,
          createdAt: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: match },
      { $count: 'total' },
    ];

    const [data, countResult] = await Promise.all([
      Reservation.aggregate(pipeline).allowDiskUse(true),
      Reservation.aggregate(countPipeline).allowDiskUse(true),
    ]);

    return {
      data,
      total: countResult.length > 0 ? countResult[0].total : 0,
    };
  },

  /**
   * Meal Distribution Report — Distribution records with reservation/mealRequest/menu info.
   */
  async getMealDistributionReport({ match, sort, skip, limit }) {
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'reservations',
          localField: 'reservation',
          foreignField: '_id',
          as: 'reservation',
        },
      },
      { $unwind: { path: '$reservation', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'mealrequests',
          localField: 'mealRequest',
          foreignField: '_id',
          as: 'mealRequest',
        },
      },
      { $unwind: { path: '$mealRequest', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'menus',
          localField: 'menu',
          foreignField: '_id',
          as: 'menu',
        },
      },
      { $unwind: { path: '$menu', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'distributedBy',
          foreignField: '_id',
          as: 'distributedBy',
        },
      },
      { $unwind: { path: '$distributedBy', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          distributionNumber: 1,
          reservationId: '$reservation._id',
          reservationNumber: '$reservation.reservationNumber',
          mealRequestId: '$mealRequest._id',
          mealRequestNumber: '$mealRequest.requestNumber',
          menuId: '$menu._id',
          menuNumber: '$menu.menuNumber',
          menuDate: '$menu.menuDate',
          mealType: '$menu.mealType',
          requestingUnit: 1,
          distributionDate: 1,
          status: 1,
          distributedById: '$distributedBy._id',
          distributedByName: '$distributedBy.displayName',
          completedBy: 1,
          completedAt: 1,
          cancelledBy: 1,
          cancelledAt: 1,
          cancelReason: 1,
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                recipe: '$$item.recipe',
                product: '$$item.product',
                batch: '$$item.batch',
                plannedQuantity: '$$item.plannedQuantity',
                actualQuantity: '$$item.actualQuantity',
                wastageQuantity: '$$item.wastageQuantity',
              },
            },
          },
          recipeSnapshots: 1,
          notes: 1,
          createdAt: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: match },
      { $count: 'total' },
    ];

    const [data, countResult] = await Promise.all([
      MealDistribution.aggregate(pipeline).allowDiskUse(true),
      MealDistribution.aggregate(countPipeline).allowDiskUse(true),
    ]);

    return {
      data,
      total: countResult.length > 0 ? countResult[0].total : 0,
    };
  },

  /**
   * Consumption Report — Aggregates InventoryTransactions of type 'issue'.
   * Groups by product, warehouse, and time period.
   */
  async getConsumptionReport({ match, groupId, sort, skip, limit }) {
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: groupId,
          totalConsumed: { $sum: '$quantity' },
          transactionCount: { $sum: 1 },
          firstTransactionDate: { $min: '$transactionDate' },
          lastTransactionDate: { $max: '$transactionDate' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'warehouses',
          localField: '_id.warehouse',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: '$_id.product',
          productName: '$product.name',
          productSku: '$product.sku',
          warehouseId: '$_id.warehouse',
          warehouseName: '$warehouse.name',
          warehouseCode: '$warehouse.code',
          period: '$_id.period',
          totalConsumed: 1,
          transactionCount: 1,
          firstTransactionDate: 1,
          lastTransactionDate: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: match },
      {
        $group: {
          _id: groupId,
        },
      },
      { $count: 'total' },
    ];

    const [data, countResult] = await Promise.all([
      InventoryTransaction.aggregate(pipeline).allowDiskUse(true),
      InventoryTransaction.aggregate(countPipeline).allowDiskUse(true),
    ]);

    return {
      data,
      total: countResult.length > 0 ? countResult[0].total : 0,
    };
  },
};

module.exports = reportRepository;
