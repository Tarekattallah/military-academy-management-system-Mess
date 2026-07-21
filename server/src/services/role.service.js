const roleRepository = require('../repositories/role.repository');
const AppError = require('../utils/AppError');

const roleService = {
  async list() {
    return roleRepository.findAll();
  },

  async getById(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    return role;
  },

  async create(data) {
    const existing = await roleRepository.findByName(data.name);
    if (existing) throw new AppError('Role name already exists', 409);
    return roleRepository.create(data);
  },

  async update(id, data) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    if (role.isSystem) {
      throw new AppError('System roles cannot be modified', 403);
    }

    return roleRepository.updateById(id, data);
  },

  async remove(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    if (role.isSystem) {
      throw new AppError('System roles cannot be deleted', 403);
    }

    return roleRepository.deleteById(id);
  },
};

module.exports = roleService;
