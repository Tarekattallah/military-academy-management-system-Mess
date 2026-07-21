const Menu = require('../models/menu.model');

const menuRepository = {
  create(data) {
    return Menu.create(data);
  },

  findById(id) {
    return Menu.findById(id)
      .populate('createdBy', 'displayName')
      .populate('items.recipe', 'name recipeNumber yield');
  },

  findAll(filter = {}) {
    return Menu.find(filter)
      .populate('createdBy', 'displayName')
      .populate('items.recipe', 'name recipeNumber yield')
      .sort({ menuDate: -1, mealType: 1 });
  },

  updateById(id, data) {
    return Menu.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },
};

module.exports = menuRepository;
