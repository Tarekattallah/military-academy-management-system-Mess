const Transfer = require('../models/transfer.model');

const transferRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return Transfer.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return Transfer.findById(id)
      .populate('sourceWarehouse', 'name code')
      .populate('destinationWarehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.sourceBatch', 'batchNumber');
  },

  findAll(filter = {}) {
    return Transfer.find(filter)
      .populate('sourceWarehouse', 'name code')
      .populate('destinationWarehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.sourceBatch', 'batchNumber')
      .sort({ transferDate: -1 });
  },
};

module.exports = transferRepository;
