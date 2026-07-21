const Receiving = require('../models/receiving.model');

const receivingRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return Receiving.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return Receiving.findById(id)
      .populate('supplier', 'name')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku');
  },

  findAll(filter = {}) {
    return Receiving.find(filter)
      .populate('supplier', 'name')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .sort({ receivingDate: -1 });
  },
};

module.exports = receivingRepository;
