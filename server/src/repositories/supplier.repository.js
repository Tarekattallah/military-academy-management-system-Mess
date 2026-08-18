const Supplier = require('../models/supplier.model');

const supplierRepository = {
  create(data) {
    return Supplier.create(data);
  },

  findById(id) {
    return Supplier.findById(id);
  },

  findByName(name) {
    return Supplier.findOne({ name });
  },

  findByCode(code) {
    return Supplier.findOne({ code });
  },

  findAll(filter = {}) {
    return Supplier.find(filter).sort({ name: 1 });
  },

  updateById(id, data) {
    return Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return Supplier.findByIdAndDelete(id);
  },
};

module.exports = supplierRepository;
