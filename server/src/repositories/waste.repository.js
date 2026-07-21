const Waste = require('../models/waste.model');

const wasteRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return Waste.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return Waste.findById(id)
      .populate('warehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.batch', 'batchNumber');
  },

  findAll(filter = {}) {
    return Waste.find(filter)
      .populate('warehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.batch', 'batchNumber')
      .sort({ wasteDate: -1 });
  },
};

module.exports = wasteRepository;
