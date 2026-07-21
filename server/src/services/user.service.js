const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');

const userService = {
  async list() {
    return userRepository.findAll();
  },

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async create({ username, email, displayName, password, roles, status }) {
    const existing = await userRepository.findByUsername(username);
    if (existing) throw new AppError('Username already exists', 409);

    const passwordHash = await hashPassword(password);

    const user = await userRepository.create({
      username,
      email,
      displayName,
      passwordHash,
      roles: roles || [],
      status: status || 'active',
    });

    return userRepository.findById(user._id);
  },

  async update(id, data) {
    const updates = { ...data };

    if (updates.password) {
      updates.passwordHash = await hashPassword(updates.password);
      delete updates.password;
    }

    const user = await userRepository.updateById(id, updates);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async remove(id) {
    const user = await userRepository.deleteById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
};

module.exports = userService;
