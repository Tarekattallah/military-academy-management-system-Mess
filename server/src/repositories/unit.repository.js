const Unit = require('../models/unit.model');

const unitRepository = {
  create(data) {
    return Unit.create(data);
  },

  findById(id) {
    return Unit.findById(id);
  },

  findByName(name) {
    return Unit.findOne({ name });
  },

  findAll(filter = {}) {
    return Unit.find(filter).sort({ name: 1 });
  },

  updateById(id, data) {
    return Unit.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return Unit.findByIdAndDelete(id);
  },
};

module.exports = unitRepository;
