const Role = require('../models/role.model');

const roleRepository = {
  create(data) {
    return Role.create(data);
  },

  findById(id) {
    return Role.findById(id).populate('permissions');
  },

  findByName(name) {
    return Role.findOne({ name });
  },

  findAll() {
    return Role.find().populate('permissions');
  },

  updateById(id, data) {
    return Role.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
      'permissions'
    );
  },

  deleteById(id) {
    return Role.findByIdAndDelete(id);
  },
};

module.exports = roleRepository;
