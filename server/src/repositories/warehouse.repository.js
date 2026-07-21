const Warehouse = require('../models/warehouse.model');

const warehouseRepository = {
  create(data) {
    return Warehouse.create(data);
  },

  findById(id) {
    return Warehouse.findById(id);
  },

  findByName(name) {
    return Warehouse.findOne({ name });
  },

  findAll(filter = {}) {
    return Warehouse.find(filter).sort({ name: 1 });
  },

  updateById(id, data) {
    return Warehouse.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return Warehouse.findByIdAndDelete(id);
  },
};

module.exports = warehouseRepository;
