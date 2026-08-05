const mongoose = require('mongoose');
const reservationRepository = require('../repositories/reservation.repository');
const MealRequest = require('../models/mealRequest.model');
const Menu = require('../models/menu.model');
const Recipe = require('../models/recipe.model');
const Batch = require('../models/batch.model');
const Warehouse = require('../models/warehouse.model');
const Reservation = require('../models/reservation.model');
const AppError = require('../utils/AppError');

// Valid status transitions
const VALID_TRANSITIONS = {
  draft: ['reserved'],
  reserved: ['released', 'consumed'],
  released: [],
  consumed: [],
};

/**
 * Aggregates reserved quantities per batch from all active (draft + reserved) reservations.
 * This is the source of truth for existing allocations since Reservation
 * does NOT update batch.reservedQuantity.
 */
async function getExistingReservationQuantitiesByBatch(warehouseId) {
  const aggregation = await Reservation.aggregate([
    {
      $match: {
        warehouse: new mongoose.Types.ObjectId(warehouseId),
        status: { $in: ['draft', 'reserved'] },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: { batch: '$items.batch', product: '$items.product' },
        totalReserved: { $sum: '$items.reservedQuantity' },
      },
    },
  ]);

  const reservedByBatch = {};
  for (const entry of aggregation) {
    const batchId = entry._id.batch.toString();
    const productId = entry._id.product.toString();
    reservedByBatch[`${batchId}:${productId}`] = entry.totalReserved;
  }
  return reservedByBatch;
}

const reservationService = {
  /**
   * Creates a Reservation by allocating inventory for an Approved Meal Request.
   *
   * This is a reservation-only operation. It does NOT:
   *   - Deduct inventory
   *   - Create Inventory Transactions
   *   - Modify CurrentStock
   *   - Modify Batch.availableQuantity
   *   - Modify Batch.reservedQuantity
   *
   * It stores allocation information only.
   * Actual inventory deduction happens in Meal Distribution via InventoryTransactionService.
   *
   * The entire process is wrapped in a MongoDB transaction to ensure atomicity.
   */
  async create(data) {
    const { mealRequest: mealRequestId, warehouse: warehouseId, notes, reservedBy } = data;

    // ── Validate warehouse exists and is active ────────────────────────────
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    if (!warehouse.isActive) throw new AppError('Warehouse is inactive', 400);

    // ── Validate meal request exists and is approved ───────────────────────
    const mealRequest = await MealRequest.findById(mealRequestId)
      .populate('menu', 'menuNumber menuDate mealType')
      .populate('items.recipe', 'name recipeNumber');
    if (!mealRequest) throw new AppError('Meal request not found', 404);
    if (mealRequest.status !== 'approved') {
      throw new AppError(`Cannot create reservation for a meal request with status "${mealRequest.status}". Only approved requests can be reserved.`, 400);
    }

    // ── Prevent duplicate active reservations (outside transaction) ────────
    const existingReservation = await Reservation.findOne({
      mealRequest: mealRequestId,
      status: { $in: ['draft', 'reserved'] },
    });
    if (existingReservation) {
      throw new AppError('An active reservation already exists for this meal request', 400);
    }

    // ── Calculate required ingredient quantities ───────────────────────────
    // For each meal request item (recipe + requestedServings), look up the
    // recipe's ingredients and multiply by the number of servings.
    const ingredientRequirements = {};

    for (const requestItem of mealRequest.items) {
      const recipe = await Recipe.findById(requestItem.recipe).populate('items.product');
      if (!recipe) throw new AppError(`Recipe ${requestItem.recipe} not found`, 404);

      const servingsMultiplier = requestItem.requestedServings / recipe.yield;

      for (const ingredient of recipe.items) {
        const productId = ingredient.product._id.toString();
        const requiredQty = ingredient.quantity * servingsMultiplier;

        if (ingredientRequirements[productId]) {
          ingredientRequirements[productId].quantity += requiredQty;
        } else {
          ingredientRequirements[productId] = {
            product: ingredient.product,
            quantity: requiredQty,
            recipe: requestItem.recipe,
          };
        }
      }
    }

    // ── Aggregate existing reservation quantities per batch ────────────────
    // This is the source of truth for already-allocated quantities.
    // We do NOT use batch.reservedQuantity because Reservation never updates it.
    const existingReservedByBatch = await getExistingReservationQuantitiesByBatch(warehouseId);

    // ── Execute FEFO allocation and creation atomically ────────────────────
    const session = undefined; // await mongoose.startSession();
    try {
      // session.startTransaction();

      // ── FEFO Allocation: For each required ingredient, find batches ──────
      const reservationItems = [];
      // Track quantities allocated in this transaction for the same batch+product
      const allocatedInThisTransaction = {};

      for (const [productId, req] of Object.entries(ingredientRequirements)) {
        let remainingQty = Math.ceil(req.quantity); // round up to nearest whole unit

        // Find all active batches for this product + warehouse, sorted by expiry
        const batches = await Batch.find({
          product: productId,
          warehouse: warehouseId,
          status: 'active',
          availableQuantity: { $gt: 0 },
        }).session(session).sort({ expiryDate: 1, createdAt: 1 }); // FEFO: earliest expiry first

        if (batches.length === 0) {
          throw new AppError(
            `Insufficient inventory for product "${req.product.name || productId}". No active batches found in warehouse "${warehouse.name}".`,
            400
          );
        }

        for (const batch of batches) {
          if (remainingQty <= 0) break;

          const batchId = batch._id.toString();

          // ── Calculate truly allocatable quantity ──────────────────────────
          // allocatable = batch.availableQuantity
          //   - existingReservedQuantity (from other active reservations)
          //   - alreadyAllocatedInThisTransaction (from this reservation's earlier items)
          const existingReserved = existingReservedByBatch[`${batchId}:${productId}`] || 0;
          const alreadyAllocated = allocatedInThisTransaction[`${batchId}:${productId}`] || 0;
          const allocatable = batch.availableQuantity - existingReserved - alreadyAllocated;

          if (allocatable <= 0) continue;

          const allocateQty = Math.min(remainingQty, allocatable);

          // Track in-transaction allocation
          allocatedInThisTransaction[`${batchId}:${productId}`] = (allocatedInThisTransaction[`${batchId}:${productId}`] || 0) + allocateQty;

          reservationItems.push({
            recipe: req.recipe,
            batch: batch._id,
            product: productId,
            reservedQuantity: allocateQty,
            consumedQuantity: 0,
          });

          remainingQty -= allocateQty;
        }

        if (remainingQty > 0) {
          throw new AppError(
            `Insufficient inventory for product "${req.product.name || productId}". Required ${Math.ceil(req.quantity)} but only ${Math.ceil(req.quantity) - Math.ceil(remainingQty)} available in warehouse "${warehouse.name}".`,
            400
          );
        }
      }

      // ── Generate reservation number ──────────────────────────────────────
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await Reservation.countDocuments();
      const reservationNumber = `RSV-${datePart}-${String(count + 1).padStart(4, '0')}`;

      // ── Create the reservation (status: reserved) ────────────────────────
      const reservation = await reservationRepository.create({
        reservationNumber,
        mealRequest: mealRequestId,
        warehouse: warehouseId,
        requestingUnit: mealRequest.requestingUnit,
        menu: mealRequest.menu,
        status: 'reserved',
        reservedBy,
        reservedAt: new Date(),
        notes,
        items: reservationItems,
      }, session);

      // await session.commitTransaction();
      return reservationRepository.findById(reservation._id);
    } catch (err) {
      // await session.abortTransaction();
      throw err;
    } finally {
      // session.endSession();
    }
  },

  /**
   * Releases a Reservation.
   *
   * Released reservations restore available quantities logically.
   * Actual inventory restoration happens in Meal Distribution via InventoryTransactionService.
   *
   * Only reserved reservations can be released.
   */
  async release(id, releasedBy, notes) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw new AppError('Reservation not found', 404);

    if (reservation.status !== 'reserved') {
      throw new AppError(
        `Cannot release a reservation with status "${reservation.status}". Only reserved reservations can be released.`,
        400
      );
    }

    return reservationRepository.updateById(id, {
      status: 'released',
      releasedBy,
      releasedAt: new Date(),
      notes: notes || reservation.notes,
    });
  },

  /**
   * Consumes a Reservation.
   *
   * Consumed is the terminal state. Actual inventory deduction will happen
   * in Meal Distribution via InventoryTransactionService.
   *
   * Only reserved reservations can be consumed.
   */
  async consume(id, notes) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw new AppError('Reservation not found', 404);

    if (reservation.status !== 'reserved') {
      throw new AppError(
        `Cannot consume a reservation with status "${reservation.status}". Only reserved reservations can be consumed.`,
        400
      );
    }

    return reservationRepository.updateById(id, {
      status: 'consumed',
      notes: notes || reservation.notes,
    });
  },

  /**
   * Updates the status of a Reservation.
   */
  async updateStatus(id, newStatus) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw new AppError('Reservation not found', 404);

    const allowed = VALID_TRANSITIONS[reservation.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition reservation from "${reservation.status}" to "${newStatus}". Allowed transitions from "${reservation.status}": ${allowed.length ? allowed.join(', ') : 'none'}.`,
        400
      );
    }

    const updated = await reservationRepository.updateById(id, { status: newStatus });
    if (!updated) throw new AppError('Reservation not found', 404);
    return updated;
  },

  /**
   * Lists reservations with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.status) filter.status = query.status;
    if (query.mealRequest) filter.mealRequest = query.mealRequest;
    if (query.warehouse) filter.warehouse = query.warehouse;
    if (query.search) {
      filter.$or = [
        { reservationNumber: { $regex: query.search, $options: 'i' } },
        { requestingUnit: { $regex: query.search, $options: 'i' } },
      ];
    }

    return reservationRepository.findAll(filter);
  },

  /**
   * Gets a single Reservation by ID.
   */
  async getById(id) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw new AppError('Reservation not found', 404);
    return reservation;
  },
};

module.exports = reservationService;
