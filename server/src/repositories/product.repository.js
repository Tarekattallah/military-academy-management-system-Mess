const Product = require('../models/product.model');

const productRepository = {
  create(data) {
    return Product.create(data);
  },

  findById(id) {
    return Product.findById(id)
      .populate('category', 'name isActive')
      .populate('unit', 'name abbreviation isActive')
      .populate('supplier', 'name isActive');
  },

  findByName(name) {
    return Product.findOne({ name });
  },

  findBySku(sku) {
    return Product.findOne({ sku });
  },

  findByBarcode(barcode) {
    return Product.findOne({ barcode });
  },

  findAll(filter = {}) {
    return Product.find(filter)
      .populate('category', 'name')
      .populate('unit', 'name abbreviation')
      .populate('supplier', 'name')
      .sort({ name: 1 });
  },

  updateById(id, data) {
    return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return Product.findByIdAndDelete(id);
  },
};

module.exports = productRepository;
