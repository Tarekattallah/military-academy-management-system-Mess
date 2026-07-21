const User = require('../models/user.model');

const userRepository = {
  create(data) {
    return User.create(data);
  },

  findById(id) {
    return User.findById(id).populate({
      path: 'roles',
      populate: { path: 'permissions' },
    });
  },

  findByIdWithPassword(id) {
    return User.findById(id).select('+passwordHash');
  },

  findByUsername(username) {
    return User.findOne({ username: username.toLowerCase() });
  },

  findByUsernameWithPassword(username) {
    return User.findOne({ username: username.toLowerCase() })
      .select('+passwordHash')
      .populate({
        path: 'roles',
        populate: { path: 'permissions' },
      });
  },

  findAll(filter = {}) {
    return User.find(filter).populate('roles', 'name');
  },

  updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return User.findByIdAndDelete(id);
  },

  touchLastLogin(id) {
    return User.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  },
};

module.exports = userRepository;
