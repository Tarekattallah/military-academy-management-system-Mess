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

  updateById(id, data, session) {
    const options = { new: true, ...(session ? { session } : {}) };
    return Receiving.findByIdAndUpdate(id, data, options)
      .populate('supplier', 'name')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku');
  },
};

module.exports = receivingRepository;
