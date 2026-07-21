const MealDistribution = require('../models/mealDistribution.model');

const mealDistributionRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return MealDistribution.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return MealDistribution.findById(id)
      .populate('reservation', 'reservationNumber status')
      .populate('mealRequest', 'requestNumber status')
      .populate('menu', 'menuNumber menuDate mealType')
      .populate('distributedBy', 'displayName')
      .populate('completedBy', 'displayName')
      .populate('items.batch', 'batchNumber expiryDate')
      .populate('items.product', 'name code')
      .populate('items.recipe', 'name recipeNumber')
      .populate('items.inventoryTransaction', 'transactionType quantity');
  },

  findAll(filter = {}) {
    return MealDistribution.find(filter)
      .populate('reservation', 'reservationNumber status')
      .populate('mealRequest', 'requestNumber status')
      .populate('menu', 'menuNumber menuDate mealType')
      .populate('distributedBy', 'displayName')
      .populate('completedBy', 'displayName')
      .populate('items.batch', 'batchNumber expiryDate')
      .populate('items.product', 'name code')
      .populate('items.recipe', 'name recipeNumber')
      .populate('items.inventoryTransaction', 'transactionType quantity')
      .sort({ createdAt: -1 });
  },

  updateById(id, data, options = {}) {
    return MealDistribution.findByIdAndUpdate(id, data, { new: true, runValidators: true, ...options });
  },
};

module.exports = mealDistributionRepository;
