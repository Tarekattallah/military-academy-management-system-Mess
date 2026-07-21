const Return = require('../models/return.model');

const returnRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return Return.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return Return.findById(id)
      .populate('warehouse', 'name code')
      .populate('supplier', 'name')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.batch', 'batchNumber');
  },

  findAll(filter = {}) {
    return Return.find(filter)
      .populate('warehouse', 'name code')
      .populate('supplier', 'name')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.batch', 'batchNumber')
      .sort({ returnDate: -1 });
  },
};

module.exports = returnRepository;
