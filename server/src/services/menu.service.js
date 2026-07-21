const menuRepository = require('../repositories/menu.repository');
const Recipe = require('../models/recipe.model');
const Menu = require('../models/menu.model');
const AppError = require('../utils/AppError');

// Valid status transitions
const VALID_TRANSITIONS = {
  draft: ['published', 'closed'],
  published: ['closed'],
  closed: [],
};

const menuService = {
  /**
   * Creates a Menu.
   *
   * Menus are business definitions only.
   * They do NOT modify inventory.
   */
  async create(data) {
    const { menuDate, mealType, items, createdBy } = data;

    // ── Validate unique menu date + meal type ──────────────────────────────
    const existing = await Menu.findOne({ menuDate: new Date(menuDate), mealType });
    if (existing) {
      const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);
      const dateLabel = new Date(menuDate).toISOString().slice(0, 10);
      throw new AppError(`A ${mealLabel} menu already exists for ${dateLabel}.`, 400);
    }

    // ── Validate no duplicate recipes in items ────────────────────────────
    const recipeIds = items.map((item) => item.recipe);
    const uniqueRecipeIds = [...new Set(recipeIds)];
    if (uniqueRecipeIds.length !== recipeIds.length) {
      throw new AppError('Duplicate recipe found in menu items. Each recipe can appear only once.', 400);
    }

    // ── Validate all recipes exist and are active ─────────────────────────
    const recipes = await Recipe.find({ _id: { $in: uniqueRecipeIds } });
    const recipeMap = {};
    for (const r of recipes) {
      if (r.status !== 'active') throw new AppError(`Recipe "${r.name}" is not active`, 400);
      recipeMap[r._id.toString()] = r;
    }
    for (const rid of uniqueRecipeIds) {
      if (!recipeMap[rid]) throw new AppError(`Recipe ${rid} not found`, 404);
    }

    // ── Generate menu number ──────────────────────────────────────────────
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Menu.countDocuments();
    const menuNumber = `MNU-${datePart}-${String(count + 1).padStart(4, '0')}`;

    return menuRepository.create({ ...data, menuNumber, createdBy });
  },

  /**
   * Updates a Menu.
   *
   * Closed menus cannot be modified.
   * Menus do NOT modify inventory.
   */
  async update(id, data) {
    const menu = await menuRepository.findById(id);
    if (!menu) throw new AppError('Menu not found', 404);

    // ── Closed menus cannot be modified ───────────────────────────────────
    if (menu.status === 'closed') {
      throw new AppError('Cannot modify a closed menu', 400);
    }

    // ── Validate unique menu date + meal type (if either is changing) ──────
    const targetDate = data.menuDate || menu.menuDate;
    const targetMeal = data.mealType || menu.mealType;
    if (data.menuDate || data.mealType) {
      const existing = await Menu.findOne({
        menuDate: new Date(targetDate),
        mealType: targetMeal,
        _id: { $ne: id },
      });
      if (existing) {
        const mealLabel = targetMeal.charAt(0).toUpperCase() + targetMeal.slice(1);
        const dateLabel = new Date(targetDate).toISOString().slice(0, 10);
        throw new AppError(`A ${mealLabel} menu already exists for ${dateLabel}.`, 400);
      }
    }

    // ── Validate recipes (if items are being updated) ─────────────────────
    if (data.items) {
      const recipeIds = data.items.map((item) => item.recipe);
      const uniqueRecipeIds = [...new Set(recipeIds)];
      if (uniqueRecipeIds.length !== recipeIds.length) {
        throw new AppError('Duplicate recipe found in menu items. Each recipe can appear only once.', 400);
      }

      const recipes = await Recipe.find({ _id: { $in: uniqueRecipeIds } });
      const recipeMap = {};
      for (const r of recipes) {
        if (r.status !== 'active') throw new AppError(`Recipe "${r.name}" is not active`, 400);
        recipeMap[r._id.toString()] = r;
      }
      for (const rid of uniqueRecipeIds) {
        if (!recipeMap[rid]) throw new AppError(`Recipe ${rid} not found`, 404);
      }
    }

    const updated = await menuRepository.updateById(id, data);
    if (!updated) throw new AppError('Menu not found', 404);
    return updated;
  },

  /**
   * Updates the status of a Menu.
   *
   * Valid transitions:
   *   draft → published
   *   draft → closed
   *   published → closed
   *   closed → (none — immutable)
   */
  async updateStatus(id, newStatus) {
    const menu = await menuRepository.findById(id);
    if (!menu) throw new AppError('Menu not found', 404);

    const allowed = VALID_TRANSITIONS[menu.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition menu from "${menu.status}" to "${newStatus}". Allowed transitions from "${menu.status}": ${allowed.length ? allowed.join(', ') : 'none'}.`,
        400
      );
    }

    const updated = await menuRepository.updateById(id, { status: newStatus });
    if (!updated) throw new AppError('Menu not found', 404);
    return updated;
  },

  /**
   * Lists menus with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.menuDate) {
      const date = new Date(query.menuDate);
      filter.menuDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lte: new Date(date.setHours(23, 59, 59, 999)),
      };
    }
    if (query.mealType) filter.mealType = query.mealType;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { menuNumber: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } },
      ];
    }

    return menuRepository.findAll(filter);
  },

  /**
   * Gets a single Menu by ID.
   */
  async getById(id) {
    const menu = await menuRepository.findById(id);
    if (!menu) throw new AppError('Menu not found', 404);
    return menu;
  },
};

module.exports = menuService;
