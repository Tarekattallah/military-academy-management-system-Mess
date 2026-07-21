const unitRepository = require('../repositories/unit.repository');
const AppError = require('../utils/AppError');

const unitService = {
  async list() {
    return unitRepository.findAll();
  },

  async getById(id) {
    const unit = await unitRepository.findById(id);
    if (!unit) throw new AppError('Unit not found', 404);
    return unit;
  },

  async create({ name, abbreviation, category, description, isActive }) {
    const trimmed = name.trim();
    const existing = await unitRepository.findByName(trimmed);
    if (existing) throw new AppError('Unit already exists', 409);

    return unitRepository.create({ name: trimmed, abbreviation, category, description, isActive });
  },

  async update(id, data) {
    if (data.name) {
      const trimmed = data.name.trim();
      const existing = await unitRepository.findByName(trimmed);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Unit name already in use', 409);
      }
      data.name = trimmed;
    }

    const unit = await unitRepository.updateById(id, data);
    if (!unit) throw new AppError('Unit not found', 404);
    return unit;
  },

  async remove(id) {
    const unit = await unitRepository.deleteById(id);
    if (!unit) throw new AppError('Unit not found', 404);
    return unit;
  },
};

module.exports = unitService;
