const recipeRepository = require('../repositories/recipe.repository');
const Product = require('../models/product.model');
const AppError = require('../utils/AppError');

const recipeService = {
  /**
   * Creates a Recipe.
   *
   * Recipes are business definitions only.
   * They do NOT modify inventory.
   */
  async create(data) {
    const { name, createdBy, items } = data;

    // ── Validate unique name ──────────────────────────────────────────────
    const trimmed = name.trim();
    const existing = await recipeRepository.findByName(trimmed);
    if (existing) throw new AppError('Recipe name already exists', 409);

    // ── Validate no duplicate products in ingredients ──────────────────────
    const productIds = items.map((item) => item.product);
    const uniqueProductIds = [...new Set(productIds)];
    if (uniqueProductIds.length !== productIds.length) {
      throw new AppError('Duplicate product found in ingredients. Each product can appear only once.', 400);
    }

    // ── Validate all products exist and are active ────────────────────────
    const products = await Product.find({ _id: { $in: uniqueProductIds } });
    const productMap = {};
    for (const p of products) {
      if (!p.isActive) throw new AppError(`Product "${p.name}" is inactive`, 400);
      productMap[p._id.toString()] = p;
    }
    for (const pid of uniqueProductIds) {
      if (!productMap[pid]) throw new AppError(`Product ${pid} not found`, 404);
    }

    // ── Calculate Standard Cost & Validate Units ───────────────────────────
    let standardCost = 0;
    for (const item of items) {
      const product = productMap[item.product];
      const itemUnitId = item.unit._id ? item.unit._id.toString() : item.unit.toString();
      const productUnitId = product.unit._id ? product.unit._id.toString() : product.unit.toString();
      
      if (itemUnitId !== productUnitId) {
        throw new AppError(`Unit mismatch for product "${product.name}". Expected unit ID ${productUnitId}, got ${itemUnitId}.`, 400);
      }
      
      standardCost += item.quantity * (product.unitPrice || 0);
    }

    // ── Generate recipe number ────────────────────────────────────────────
    const Recipe = require('../models/recipe.model');
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Recipe.countDocuments();
    const recipeNumber = `RCP-${datePart}-${String(count + 1).padStart(4, '0')}`;

    return recipeRepository.create({ ...data, name: trimmed, recipeNumber, createdBy, standardCost });
  },

  /**
   * Updates a Recipe.
   *
   * Recipes are business definitions only.
   * They do NOT modify inventory.
   */
  async update(id, data) {
    // ── Validate recipe exists ────────────────────────────────────────────
    const recipe = await recipeRepository.findById(id);
    if (!recipe) throw new AppError('Recipe not found', 404);

    // ── Validate unique name (if changing) ────────────────────────────────
    if (data.name) {
      const trimmed = data.name.trim();
      const existing = await recipeRepository.findByName(trimmed);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Recipe name already in use', 409);
      }
      data.name = trimmed;
    }

    // ── Validate products (if items are being updated) ────────────────────
    if (data.items) {
      const productIds = data.items.map((item) => item.product);
      const uniqueProductIds = [...new Set(productIds)];
      if (uniqueProductIds.length !== productIds.length) {
        throw new AppError('Duplicate product found in ingredients. Each product can appear only once.', 400);
      }

      const products = await Product.find({ _id: { $in: uniqueProductIds } });
      const productMap = {};
      for (const p of products) {
        if (!p.isActive) throw new AppError(`Product "${p.name}" is inactive`, 400);
        productMap[p._id.toString()] = p;
      }
      for (const pid of uniqueProductIds) {
        if (!productMap[pid]) throw new AppError(`Product ${pid} not found`, 404);
      }

      // ── Calculate Standard Cost & Validate Units ───────────────────────────
      let standardCost = 0;
      for (const item of data.items) {
        const product = productMap[item.product];
        const itemUnitId = item.unit._id ? item.unit._id.toString() : item.unit.toString();
        const productUnitId = product.unit._id ? product.unit._id.toString() : product.unit.toString();
        
        if (itemUnitId !== productUnitId) {
          throw new AppError(`Unit mismatch for product "${product.name}". Expected unit ID ${productUnitId}, got ${itemUnitId}.`, 400);
        }
        
        standardCost += item.quantity * (product.unitPrice || 0);
      }
      data.standardCost = standardCost;
    }

    const updated = await recipeRepository.updateById(id, data);
    if (!updated) throw new AppError('Recipe not found', 404);
    return updated;
  },

  /**
   * Updates the status of a Recipe (active/inactive).
   */
  async updateStatus(id, status) {
    const recipe = await recipeRepository.updateById(id, { status });
    if (!recipe) throw new AppError('Recipe not found', 404);
    return recipe;
  },

  /**
   * Lists recipes with optional filters.
   */
  async list(query = {}) {
    const filter = {};

    if (query.name) filter.name = { $regex: query.name, $options: 'i' };
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { recipeNumber: { $regex: query.search, $options: 'i' } },
      ];
    }

    return recipeRepository.findAll(filter);
  },

  /**
   * Gets a single Recipe by ID.
   */
  async getById(id) {
    const recipe = await recipeRepository.findById(id);
    if (!recipe) throw new AppError('Recipe not found', 404);
    return recipe;
  },
  /**
   * Recalculates standardCost for all recipes containing a specific product.
   * Called by Product service when a product's unit price changes.
   */
  async recalculateCostsForProduct(productId) {
    const Recipe = require('../models/recipe.model');
    // Find all recipes containing this product
    const recipes = await Recipe.find({ 'items.product': productId });
    
    if (!recipes.length) return;
    
    // For each recipe, calculate new standard cost
    for (const recipe of recipes) {
      // Need to populate products to get their latest unitPrices
      const populatedRecipe = await Recipe.findById(recipe._id).populate('items.product');
      let standardCost = 0;
      let hasMismatch = false;
      
      for (const item of populatedRecipe.items) {
        const product = item.product; // populated
        const itemUnitId = item.unit._id ? item.unit._id.toString() : item.unit.toString();
        const productUnitId = product.unit._id ? product.unit._id.toString() : product.unit.toString();
        
        if (itemUnitId !== productUnitId) {
          hasMismatch = true;
          // Log error, but we cannot fail the whole operation easily.
          console.error(`Unit mismatch in recipe ${recipe.recipeNumber} for product ${product.name}`);
        } else {
          standardCost += item.quantity * (product.unitPrice || 0);
        }
      }
      
      if (!hasMismatch) {
        recipe.standardCost = standardCost;
        await recipe.save();
      }
    }
  },
};

module.exports = recipeService;
