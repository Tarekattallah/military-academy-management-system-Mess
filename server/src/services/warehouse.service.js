const warehouseRepository = require('../repositories/warehouse.repository');
const AppError = require('../utils/AppError');

const warehouseService = {
  async list() {
    return warehouseRepository.findAll();
  },

  async getById(id) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    return warehouse;
  },

  async create({ name, code, location, manager, phone, notes, isActive }) {
    const trimmed = name.trim();
    const existing = await warehouseRepository.findByName(trimmed);
    if (existing) throw new AppError('Warehouse already exists', 409);

    return warehouseRepository.create({ name: trimmed, code: code.trim().toUpperCase(), location, manager, phone, notes, isActive });
  },

  async update(id, data) {
    if (data.name) {
      const trimmed = data.name.trim();
      const existing = await warehouseRepository.findByName(trimmed);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Warehouse name already in use', 409);
      }
      data.name = trimmed;
    }

    const warehouse = await warehouseRepository.updateById(id, data);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    return warehouse;
  },

  async remove(id) {
    const warehouse = await warehouseRepository.deleteById(id);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    return warehouse;
  },
};

module.exports = warehouseService;
