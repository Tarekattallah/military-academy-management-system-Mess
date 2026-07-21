const Batch = require('../models/batch.model');

const batchRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return Batch.create([data], options).then((result) => result[0]);
  },

  findById(id, session) {
    const query = Batch.findById(id)
      .populate('product', 'name sku isActive')
      .populate('warehouse', 'name code')
      .populate('supplier', 'name');
    if (session) query.session(session);
    return query;
  },

  findByIdentifier(productId, warehouseId, batchNumber, session) {
    const options = session ? { session } : {};
    return Batch.findOne({ product: productId, warehouse: warehouseId, batchNumber }, null, options);
  },

  findAll(filter = {}) {
    return Batch.find(filter)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('supplier', 'name')
      .sort({ createdAt: -1 });
  },

  updateById(id, data, session) {
    const options = { new: true, runValidators: true };
    if (session) options.session = session;
    return Batch.findByIdAndUpdate(id, data, options);
  },

  deleteById(id) {
    return Batch.findByIdAndDelete(id);
  },
};

module.exports = batchRepository;
