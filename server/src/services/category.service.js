const categoryRepository = require('../repositories/category.repository');
const AppError = require('../utils/AppError');

const categoryService = {
  async list() {
    return categoryRepository.findAll();
  },

  async getById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404);
    return category;
  },

  async create({ name, description, isActive }) {
    const trimmed = name.trim();
    const existing = await categoryRepository.findByName(trimmed);
    if (existing) throw new AppError('Category already exists', 409);

    return categoryRepository.create({ name: trimmed, description, isActive });
  },

  async update(id, data) {
    if (data.name) {
      const trimmed = data.name.trim();
      const existing = await categoryRepository.findByName(trimmed);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Category name already in use', 409);
      }
      data.name = trimmed;
    }

    const category = await categoryRepository.updateById(id, data);
    if (!category) throw new AppError('Category not found', 404);
    return category;
  },

  async remove(id) {
    const category = await categoryRepository.deleteById(id);
    if (!category) throw new AppError('Category not found', 404);
    return category;
  },
};

module.exports = categoryService;
