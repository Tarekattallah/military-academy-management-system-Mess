const mealRequestRepository = require('../repositories/mealRequest.repository');
const Menu = require('../models/menu.model');
const MealRequest = require('../models/mealRequest.model');
const AppError = require('../utils/AppError');

// Valid status transitions
const VALID_TRANSITIONS = {
  draft: ['submitted'],
  submitted: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: [],
  completed: [],
};

function broadcastMealRequestUpdate() {
  try {
    const websocket = require('../utils/websocket');
    websocket.broadcast('notifications_update', { type: 'meal-request' });
  } catch (e) {
    console.error('[websocket] Broadcast failed:', e.message);
  }
}

const mealRequestService = {
  /**
   * Creates a Meal Request.
   *
   * Meal Requests are business requests only.
   * They do NOT modify inventory.
   */
  async create(data) {
    const { menu: menuId, items, requestedBy } = data;

    // ── Validate menu exists and is published ──────────────────────────────
    const menu = await Menu.findById(menuId);
    if (!menu) throw new AppError('Menu not found', 404);
    if (menu.status === 'closed') throw new AppError('Cannot create meal request for a closed menu', 400);
    if (menu.status !== 'published') throw new AppError('Only published menus can be requested', 400);

    // ── Validate no duplicate recipes in items ────────────────────────────
    const recipeIds = items.map((item) => item.recipe);
    const uniqueRecipeIds = [...new Set(recipeIds)];
    if (uniqueRecipeIds.length !== recipeIds.length) {
      throw new AppError('Duplicate recipe found in request items. Each recipe can appear only once.', 400);
    }

    // ── Generate request number ────────────────────────────────────────────
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await MealRequest.countDocuments();
    const requestNumber = `MRQ-${datePart}-${String(count + 1).padStart(4, '0')}`;

    const result = await mealRequestRepository.create({ ...data, requestNumber, requestedBy });
    broadcastMealRequestUpdate();
    return result;
  },

  /**
   * Updates a Meal Request.
   *
   * Completed requests cannot be edited.
   * Meal Requests do NOT modify inventory.
   */
  async update(id, data) {
    const request = await mealRequestRepository.findById(id);
    if (!request) throw new AppError('Meal request not found', 404);

    // ── Completed requests cannot be modified ─────────────────────────────
    if (request.status === 'completed') {
      throw new AppError('Cannot modify a completed meal request', 400);
    }

    // ── Approved/rejected requests cannot be modified ──────────────────────
    if (request.status === 'approved' || request.status === 'rejected') {
      throw new AppError(`Cannot modify a ${request.status} meal request. Only draft/submitted requests can be edited.`, 400);
    }

    // ── Validate menu (if changing) ────────────────────────────────────────
    if (data.menu) {
      const menu = await Menu.findById(data.menu);
      if (!menu) throw new AppError('Menu not found', 404);
      if (menu.status === 'closed') throw new AppError('Cannot assign a closed menu', 400);
      if (menu.status !== 'published') throw new AppError('Only published menus can be assigned', 400);
    }

    // ── Validate duplicate recipes (if items are changing) ─────────────────
    if (data.items) {
      const recipeIds = data.items.map((item) => item.recipe);
      const uniqueRecipeIds = [...new Set(recipeIds)];
      if (uniqueRecipeIds.length !== recipeIds.length) {
        throw new AppError('Duplicate recipe found in request items. Each recipe can appear only once.', 400);
      }
    }

    const updated = await mealRequestRepository.updateById(id, data);
    if (!updated) throw new AppError('Meal request not found', 404);
    broadcastMealRequestUpdate();
    return updated;
  },

  /**
   * Approves a Meal Request.
   *
   * Only submitted requests can be approved.
   * A rejected request cannot be approved.
   * A completed request cannot be approved.
   *
   * Approval does NOT reserve inventory.
   * Inventory reservation and consumption happen in later modules.
   */
  async approve(id, approvedBy) {
    const request = await mealRequestRepository.findById(id);
    if (!request) throw new AppError('Meal request not found', 404);

    // ── Validate current status allows approval ───────────────────────────
    if (request.status !== 'submitted') {
      throw new AppError(
        `Cannot approve a meal request with status "${request.status}". Only submitted requests can be approved.`,
        400
      );
    }

    const updated = await mealRequestRepository.updateById(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });
    if (!updated) throw new AppError('Meal request not found', 404);
    broadcastMealRequestUpdate();
    return updated;
  },

  /**
   * Rejects a Meal Request.
   *
   * Only submitted requests can be rejected.
   * A rejected request cannot be approved.
   */
  async reject(id, reason) {
    const request = await mealRequestRepository.findById(id);
    if (!request) throw new AppError('Meal request not found', 404);

    // ── Validate current status allows rejection ──────────────────────────
    if (request.status !== 'submitted') {
      throw new AppError(
        `Cannot reject a meal request with status "${request.status}". Only submitted requests can be rejected.`,
        400
      );
    }

    const updated = await mealRequestRepository.updateById(id, {
      status: 'rejected',
      notes: reason ? `${request.notes || ''} [Rejected: ${reason}]`.trim() : request.notes,
    });
    if (!updated) throw new AppError('Meal request not found', 404);
    broadcastMealRequestUpdate();
    return updated;
  },

  /**
   * Updates the status of a Meal Request.
   */
  async updateStatus(id, newStatus) {
    const request = await mealRequestRepository.findById(id);
    if (!request) throw new AppError('Meal request not found', 404);

    const allowed = VALID_TRANSITIONS[request.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition meal request from "${request.status}" to "${newStatus}". Allowed transitions from "${request.status}": ${allowed.length ? allowed.join(', ') : 'none'}.`,
        400
      );
    }

    const updated = await mealRequestRepository.updateById(id, { status: newStatus });
    if (!updated) throw new AppError('Meal request not found', 404);
    broadcastMealRequestUpdate();
    return updated;
  },

  /**
   * Lists meal requests with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.status) filter.status = query.status;
    if (query.menu) filter.menu = query.menu;
    if (query.requestingUnit) filter.requestingUnit = { $regex: query.requestingUnit, $options: 'i' };
    if (query.requestDate) {
      const date = new Date(query.requestDate);
      filter.requestDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lte: new Date(date.setHours(23, 59, 59, 999)),
      };
    }
    if (query.search) {
      filter.$or = [
        { requestNumber: { $regex: query.search, $options: 'i' } },
        { requestingUnit: { $regex: query.search, $options: 'i' } },
      ];
    }

    return mealRequestRepository.findAll(filter);
  },

  /**
   * Gets a single Meal Request by ID.
   */
  async getById(id) {
    const request = await mealRequestRepository.findById(id);
    if (!request) throw new AppError('Meal request not found', 404);
    return request;
  },
};

module.exports = mealRequestService;
