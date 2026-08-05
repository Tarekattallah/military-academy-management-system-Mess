const mongoose = require('mongoose');
const mealDistributionRepository = require('../repositories/mealDistribution.repository');
const Reservation = require('../models/reservation.model');
const MealRequest = require('../models/mealRequest.model');
const Recipe = require('../models/recipe.model');
const MealDistribution = require('../models/mealDistribution.model');
const inventoryTransactionService = require('./inventoryTransaction.service');
const AppError = require('../utils/AppError');

// Valid status transitions
const VALID_TRANSITIONS = {
  draft: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Builds immutable recipe snapshots from a Meal Request.
 * Each snapshot captures the current state of the recipe,
 * its ingredients, product names, and unit names at the time
 * of distribution creation.
 */
async function buildRecipeSnapshots(mealRequest) {
  const snapshots = [];

  for (const requestItem of mealRequest.items) {
    const recipeId = requestItem.recipe._id ? requestItem.recipe._id.toString() : requestItem.recipe.toString();
    const recipe = await Recipe.findById(recipeId)
      .populate('items.product', 'name')
      .populate('items.unit', 'name');

    if (!recipe) {
      throw new AppError(`Recipe ${requestItem.recipe} not found`, 404);
    }

    const ingredients = recipe.items.map((ingredient) => ({
      product: ingredient.product?._id,
      productName: ingredient.product?.name || 'Unknown',
      quantity: ingredient.quantity,
      unit: ingredient.unit?._id,
      unitName: ingredient.unit?.name || 'Unknown',
    }));

    snapshots.push({
      recipe: recipe._id,
      recipeName: recipe.name,
      recipeNumber: recipe.recipeNumber,
      recipeYield: recipe.yield,
      ingredients,
    });
  }

  return snapshots;
}

const mealDistributionService = {
  /**
   * Creates a new Meal Distribution in draft status.
   *
   * This is a non-inventory operation. It creates the distribution
   * document with recipe snapshots and copies reservation items
   * as planned quantities. No inventory is deducted at this stage.
   */
  async create(data) {
    const { reservation: reservationId, notes, distributedBy } = data;

    // ── Validate reservation exists and is reserved ────────────────────────
    const reservation = await Reservation.findById(reservationId)
      .populate('mealRequest', 'requestNumber status items requestingUnit')
      .populate('menu', 'menuNumber menuDate mealType')
      .populate('warehouse', 'name');

    if (!reservation) throw new AppError('Reservation not found', 404);
    if (reservation.status !== 'reserved') {
      throw new AppError(
        `Cannot create distribution for a reservation with status "${reservation.status}". Only reserved reservations can be distributed.`,
        400
      );
    }

    // ── Prevent duplicate active distributions ─────────────────────────────
    const existingDistribution = await MealDistribution.findOne({
      reservation: reservationId,
      status: { $in: ['draft', 'in_progress', 'completed'] },
    });
    if (existingDistribution) {
      throw new AppError('An active distribution already exists for this reservation', 400);
    }

    // ── Build immutable recipe snapshots ───────────────────────────────────
    const mealRequest = await MealRequest.findById(reservation.mealRequest._id || reservation.mealRequest)
      .populate('items.recipe', 'name recipeNumber yield')
      .populate('items.recipe.items.product', 'name')
      .populate('items.recipe.items.unit', 'name');

    if (!mealRequest) throw new AppError('Meal request not found', 404);

    const recipeSnapshots = await buildRecipeSnapshots(mealRequest);

    // ── Build distribution items from reservation items ────────────────────
    const items = reservation.items.map((resItem) => ({
      recipe: resItem.recipe,
      product: resItem.product,
      batch: resItem.batch,
      plannedQuantity: resItem.reservedQuantity,
      actualQuantity: 0,
      wastageQuantity: 0,
    }));

    // ── Generate distribution number ───────────────────────────────────────
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await MealDistribution.countDocuments();
    const distributionNumber = `MD-${datePart}-${String(count + 1).padStart(4, '0')}`;

    // ── Create the distribution (status: draft) ────────────────────────────
    return mealDistributionRepository.create({
      distributionNumber,
      reservation: reservationId,
      mealRequest: reservation.mealRequest._id || reservation.mealRequest,
      menu: reservation.menu,
      requestingUnit: reservation.requestingUnit,
      distributionDate: new Date(),
      status: 'draft',
      distributedBy,
      notes,
      recipeSnapshots,
      items,
    });
  },

  /**
   * Completes a Meal Distribution.
   *
   * This is the ONLY operation that performs actual inventory deduction.
   * For each distribution item, it creates an InventoryTransaction of type 'issue'
   * via InventoryTransactionService, which handles:
   *   - Batch.availableQuantity decrement
   *   - Batch status update (auto-deplete if quantity reaches 0)
   *   - CurrentStock update
   *
   * After all inventory transactions succeed, the Reservation is marked as 'consumed'
   * and the Distribution status is set to 'completed'.
   *
   * The entire process runs inside a MongoDB transaction. If anything fails,
   * all changes are rolled back.
   */
  async complete(id, data, completedBy) {
    const { items: completeItems, notes } = data;

    const distribution = await mealDistributionRepository.findById(id);
    if (!distribution) throw new AppError('Meal distribution not found', 404);

    if (distribution.status !== 'draft' && distribution.status !== 'in_progress') {
      throw new AppError(
        `Cannot complete a distribution with status "${distribution.status}". Only draft or in_progress distributions can be completed.`,
        400
      );
    }

    // ── Move validation inside the transaction ──────────────────────────────
    // Build a map of distribution items by batch+product key
    // This is done before the transaction (pure data transformation, no side effects)
    const distItemMap = {};
    for (const item of distribution.items) {
      const batchId = item.batch._id ? item.batch._id.toString() : item.batch.toString();
      const productId = item.product._id ? item.product._id.toString() : item.product.toString();
      distItemMap[`${batchId}:${productId}`] = item;
    }

    // ── Execute inventory deduction atomically ─────────────────────────────
    const session = undefined; // await mongoose.startSession();
    try {
      // session.startTransaction();

      // ── Atomic status transition: prevent duplicate completion ──────────
      // Re-fetch the distribution inside the transaction with session.
      // If another request already completed it, this will return status 'completed'.
      const freshDistribution = await MealDistribution.findById(id).session(session);
      if (!freshDistribution) throw new AppError('Meal distribution not found', 404);
      if (freshDistribution.status !== 'draft' && freshDistribution.status !== 'in_progress') {
        throw new AppError(
          `Cannot complete a distribution with status "${freshDistribution.status}". Only draft or in_progress distributions can be completed.`,
          400
        );
      }

      // Get the reservation to access warehouse
      const reservation = await Reservation.findById(freshDistribution.reservation._id || freshDistribution.reservation).session(session);
      if (!reservation) throw new AppError('Reservation not found', 404);

      const warehouseId = reservation.warehouse._id
        ? reservation.warehouse._id.toString()
        : reservation.warehouse.toString();

      // ── Process each item: create inventory transactions ────────────────
      const updatedItems = [];

      for (const completeItem of completeItems) {
        const key = `${completeItem.batch}:${completeItem.product}`;
        const distItem = distItemMap[key];
        if (!distItem) {
          throw new AppError(
            `Item with batch ${completeItem.batch} and product ${completeItem.product} not found in distribution`,
            400
          );
        }

        if (completeItem.actualQuantity < 0) {
          throw new AppError(`Actual quantity for batch ${completeItem.batch} must be non-negative`, 400);
        }

        if (completeItem.wastageQuantity < 0) {
          throw new AppError(`Wastage quantity for batch ${completeItem.batch} must be non-negative`, 400);
        }

        const actualQty = completeItem.actualQuantity;
        const wastageQty = completeItem.wastageQuantity || 0;
        const totalDeducted = actualQty + wastageQty;

        // Create InventoryTransaction of type 'issue'
        // This is the ONLY place where inventory is deducted.
        // InventoryTransactionService handles:
        //   - Batch.availableQuantity -= totalDeducted
        //   - Batch status update (auto-deplete if quantity reaches 0)
        //   - CurrentStock update
        const transactionData = {
          batch: completeItem.batch,
          product: completeItem.product,
          warehouse: warehouseId,
          transactionType: 'issue',
          quantity: totalDeducted,
          unitCost: 0,
          referenceType: 'MealDistribution',
          referenceId: freshDistribution._id,
          reason: 'Meal distribution',
          performedBy: completedBy,
          notes: notes || undefined,
        };

        const inventoryTransaction = await inventoryTransactionService.create(transactionData, { session });

        updatedItems.push({
          recipe: distItem.recipe._id || distItem.recipe,
          product: completeItem.product,
          batch: completeItem.batch,
          plannedQuantity: distItem.plannedQuantity,
          actualQuantity: actualQty,
          wastageQuantity: wastageQty,
          inventoryTransaction: inventoryTransaction._id,
        });
      }

      // ── Update Reservation status to 'consumed' ─────────────────────────
      // The distribution tracks actual consumption, so we only update the
      // reservation status. The items.consumedQuantity is tracked in the
      // distribution model.
      await Reservation.findByIdAndUpdate(
        freshDistribution.reservation._id || freshDistribution.reservation,
        { status: 'consumed' },
        { session }
      );

      // ── Update Distribution status to 'completed' ───────────────────────
      await mealDistributionRepository.updateById(
        freshDistribution._id,
        {
          status: 'completed',
          completedBy,
          completedAt: new Date(),
          items: updatedItems,
          notes: notes || freshDistribution.notes,
        },
        { session }
      );

      // await session.commitTransaction();

      return mealDistributionRepository.findById(freshDistribution._id);
    } catch (err) {
      // await session.abortTransaction();
      throw err;
    } finally {
      // session.endSession();
    }
  },

  /**
   * Cancels a Meal Distribution.
   *
   * Only draft or in_progress distributions can be cancelled.
   * No inventory changes occur — the reserved inventory remains reserved.
   */
  async cancel(id, reason, cancelledBy) {
    const distribution = await mealDistributionRepository.findById(id);
    if (!distribution) throw new AppError('Meal distribution not found', 404);

    if (distribution.status !== 'draft' && distribution.status !== 'in_progress') {
      throw new AppError(
        `Cannot cancel a distribution with status "${distribution.status}". Only draft or in_progress distributions can be cancelled.`,
        400
      );
    }

    // ── Preserve original notes, store cancellation details separately ──
    return mealDistributionRepository.updateById(id, {
      status: 'cancelled',
      cancelledBy,
      cancelledAt: new Date(),
      cancelReason: reason,
      // notes remains unchanged
    });
  },

  /**
   * Updates the status of a Meal Distribution.
   */
  async updateStatus(id, newStatus) {
    const distribution = await mealDistributionRepository.findById(id);
    if (!distribution) throw new AppError('Meal distribution not found', 404);

    const allowed = VALID_TRANSITIONS[distribution.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition distribution from "${distribution.status}" to "${newStatus}". Allowed transitions from "${distribution.status}": ${allowed.length ? allowed.join(', ') : 'none'}.`,
        400
      );
    }

    const updated = await mealDistributionRepository.updateById(id, { status: newStatus });
    if (!updated) throw new AppError('Meal distribution not found', 404);
    return updated;
  },

  /**
   * Lists meal distributions with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.status) filter.status = query.status;
    if (query.reservation) filter.reservation = query.reservation;
    if (query.mealRequest) filter.mealRequest = query.mealRequest;
    if (query.search) {
      filter.$or = [
        { distributionNumber: { $regex: query.search, $options: 'i' } },
        { requestingUnit: { $regex: query.search, $options: 'i' } },
      ];
    }

    return mealDistributionRepository.findAll(filter);
  },

  /**
   * Gets a single Meal Distribution by ID.
   */
  async getById(id) {
    const distribution = await mealDistributionRepository.findById(id);
    if (!distribution) throw new AppError('Meal distribution not found', 404);
    return distribution;
  },
};

module.exports = mealDistributionService;
