const supplierRepository = require('../repositories/supplier.repository');
const AppError = require('../utils/AppError');

const supplierService = {
  async list() {
    return supplierRepository.findAll();
  },

  async getById(id) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) throw new AppError('Supplier not found', 404);
    return supplier;
  },

  async create({ name, code, contactPerson, phone, email, address, taxId, paymentTerms, leadTimeDays, notes, isActive }) {
    const trimmed = name.trim();
    const existing = await supplierRepository.findByName(trimmed);
    if (existing) throw new AppError('Supplier already exists', 409);

    // Check unique code if provided
    if (code) {
      const existingCode = await supplierRepository.findByCode(code.trim().toUpperCase());
      if (existingCode) throw new AppError('Supplier code already in use', 409);
    }

    return supplierRepository.create({ name: trimmed, code: code ? code.trim().toUpperCase() : undefined, contactPerson, phone, email, address, taxId, paymentTerms, leadTimeDays, notes, isActive });
  },

  async update(id, data) {
    if (data.name) {
      const trimmed = data.name.trim();
      const existing = await supplierRepository.findByName(trimmed);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Supplier name already in use', 409);
      }
      data.name = trimmed;
    }

    const supplier = await supplierRepository.updateById(id, data);
    if (!supplier) throw new AppError('Supplier not found', 404);
    return supplier;
  },

  async remove(id) {
    const supplier = await supplierRepository.deleteById(id);
    if (!supplier) throw new AppError('Supplier not found', 404);
    return supplier;
  },
};

module.exports = supplierService;
