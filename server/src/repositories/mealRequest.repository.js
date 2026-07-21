const MealRequest = require('../models/mealRequest.model');

const mealRequestRepository = {
  create(data) {
    return MealRequest.create(data);
  },

  findById(id) {
    return MealRequest.findById(id)
      .populate('requestedBy', 'displayName')
      .populate('approvedBy', 'displayName')
      .populate('menu', 'menuNumber menuDate mealType status')
      .populate('items.recipe', 'name recipeNumber yield');
  },

  findAll(filter = {}) {
    return MealRequest.find(filter)
      .populate('requestedBy', 'displayName')
      .populate('approvedBy', 'displayName')
      .populate('menu', 'menuNumber menuDate mealType status')
      .populate('items.recipe', 'name recipeNumber yield')
      .sort({ requestDate: -1 });
  },

  updateById(id, data) {
    return MealRequest.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },
};

module.exports = mealRequestRepository;
