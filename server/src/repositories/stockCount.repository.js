const StockCount = require('../models/stockCount.model');

const stockCountRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return StockCount.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return StockCount.findById(id)
      .populate('warehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('approvedBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.batch', 'batchNumber');
  },

  findAll(filter = {}) {
    return StockCount.find(filter)
      .populate('warehouse', 'name code')
      .populate('createdBy', 'displayName')
      .populate('items.product', 'name sku')
      .populate('items.batch', 'batchNumber')
      .sort({ countDate: -1 });
  },

  updateById(id, updates, session) {
    const options = { new: true, runValidators: true };
    if (session) options.session = session;
    return StockCount.findByIdAndUpdate(id, updates, options);
  },
};

module.exports = stockCountRepository;
