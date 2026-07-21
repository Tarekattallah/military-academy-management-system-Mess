const InventoryTransaction = require('../models/inventoryTransaction.model');

const inventoryTransactionRepository = {
  create(data, session) {
    const options = session ? { session } : {};
    return InventoryTransaction.create([data], options).then((result) => result[0]);
  },

  findById(id) {
    return InventoryTransaction.findById(id)
      .populate('batch', 'batchNumber')
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('performedBy', 'displayName');
  },

  findAll(filter = {}) {
    return InventoryTransaction.find(filter)
      .populate('batch', 'batchNumber')
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('performedBy', 'displayName')
      .sort({ transactionDate: -1 });
  },
};

module.exports = inventoryTransactionRepository;
