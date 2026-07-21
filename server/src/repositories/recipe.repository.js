const Recipe = require('../models/recipe.model');

const recipeRepository = {
  create(data) {
    return Recipe.create(data);
  },

  findById(id) {
    return Recipe.findById(id)
      .populate('category', 'name')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.unit', 'name abbreviation');
  },

  findByName(name) {
    return Recipe.findOne({ name });
  },

  findAll(filter = {}) {
    return Recipe.find(filter)
      .populate('category', 'name')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.unit', 'name abbreviation')
      .sort({ name: 1 });
  },

  updateById(id, data) {
    return Recipe.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },
};

module.exports = recipeRepository;
