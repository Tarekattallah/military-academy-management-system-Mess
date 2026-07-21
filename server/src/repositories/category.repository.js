const Category = require('../models/category.model');

const categoryRepository = {
  create(data) {
    return Category.create(data);
  },

  findById(id) {
    return Category.findById(id);
  },

  findByName(name) {
    return Category.findOne({ name });
  },

  findAll(filter = {}) {
    return Category.find(filter).sort({ name: 1 });
  },

  updateById(id, data) {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return Category.findByIdAndDelete(id);
  },
};

module.exports = categoryRepository;
