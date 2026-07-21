const CurrentStock = require('../models/currentStock.model');

const currentStockRepository = {
  upsert(productId, warehouseId, data, session) {
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    if (session) options.session = session;
    return CurrentStock.findOneAndUpdate(
      { product: productId, warehouse: warehouseId },
      { $set: data },
      options
    );
  },

  findById(id) {
    return CurrentStock.findById(id)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code');
  },

  findByProductAndWarehouse(productId, warehouseId) {
    return CurrentStock.findOne({ product: productId, warehouse: warehouseId })
      .populate('product', 'name sku')
      .populate('warehouse', 'name code');
  },

  findAll(filter = {}) {
    return CurrentStock.find(filter)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .sort({ availableQuantity: -1 });
  },
};

module.exports = currentStockRepository;
