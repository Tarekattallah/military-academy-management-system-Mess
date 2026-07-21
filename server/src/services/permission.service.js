const permissionRepository = require('../repositories/permission.repository');
const AppError = require('../utils/AppError');

const permissionService = {
  async list() {
    return permissionRepository.findAll();
  },

  async getById(id) {
    const permission = await permissionRepository.findById(id);
    if (!permission) throw new AppError('Permission not found', 404);
    return permission;
  },

  async create(data) {
    const code = `${data.module}:${data.action}`.toLowerCase();
    const existing = await permissionRepository.findByCode(code);
    if (existing) throw new AppError('Permission already exists', 409);

    return permissionRepository.create({ ...data, code });
  },

  async update(id, data) {
    const permission = await permissionRepository.updateById(id, data);
    if (!permission) throw new AppError('Permission not found', 404);
    return permission;
  },

  async remove(id) {
    const permission = await permissionRepository.deleteById(id);
    if (!permission) throw new AppError('Permission not found', 404);
    return permission;
  },
};

module.exports = permissionService;
