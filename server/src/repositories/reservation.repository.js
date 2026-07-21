const Reservation = require('../models/reservation.model');

const reservationRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return Reservation.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return Reservation.findById(id)
      .populate('mealRequest', 'requestNumber status')
      .populate('warehouse', 'name')
      .populate('menu', 'menuNumber menuDate mealType')
      .populate('reservedBy', 'displayName')
      .populate('releasedBy', 'displayName')
      .populate('items.batch', 'batchNumber expiryDate')
      .populate('items.product', 'name code')
      .populate('items.recipe', 'name recipeNumber');
  },

  findAll(filter = {}) {
    return Reservation.find(filter)
      .populate('mealRequest', 'requestNumber status')
      .populate('warehouse', 'name')
      .populate('menu', 'menuNumber menuDate mealType')
      .populate('reservedBy', 'displayName')
      .populate('releasedBy', 'displayName')
      .populate('items.batch', 'batchNumber expiryDate')
      .populate('items.product', 'name code')
      .populate('items.recipe', 'name recipeNumber')
      .sort({ createdAt: -1 });
  },

  updateById(id, data, options = {}) {
    return Reservation.findByIdAndUpdate(id, data, { new: true, runValidators: true, ...options });
  },
};

module.exports = reservationRepository;
