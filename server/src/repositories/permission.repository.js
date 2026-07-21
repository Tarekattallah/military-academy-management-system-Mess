const Permission = require('../models/permission.model');

const permissionRepository = {
  create(data) {
    return Permission.create(data);
  },

  findById(id) {
    return Permission.findById(id);
  },

  findByCode(code) {
    return Permission.findOne({ code: code.toLowerCase() });
  },

  findAll(filter = {}) {
    return Permission.find(filter).sort({ module: 1, action: 1 });
  },

  updateById(id, data) {
    return Permission.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return Permission.findByIdAndDelete(id);
  },
};

module.exports = permissionRepository;
