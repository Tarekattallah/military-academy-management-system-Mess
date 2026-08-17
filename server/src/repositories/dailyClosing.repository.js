const DailyClosing = require('../models/dailyClosing.model');

class DailyClosingRepository {
  async create(data, options = {}) {
    const dailyClosing = new DailyClosing(data);
    return dailyClosing.save(options);
  }

  async findById(id) {
    return DailyClosing.findById(id).populate('warehouse openedBy closedBy approvedBy');
  }

  async findByLogicalDateAndWarehouse(logicalDate, warehouseId) {
    // logicalDate is expected to be a date object set to midnight (UTC or local, consistently)
    return DailyClosing.findOne({ logicalDate, warehouse: warehouseId }).populate('warehouse openedBy closedBy approvedBy');
  }

  async findLatestClosedDay(warehouseId) {
    return DailyClosing.findOne({ warehouse: warehouseId, status: 'CLOSED' })
      .sort({ logicalDate: -1 })
      .populate('warehouse openedBy closedBy approvedBy');
  }

  async findAll(query = {}) {
    const { page = 1, limit = 10, sort = '-logicalDate', ...filters } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      DailyClosing.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('warehouse openedBy closedBy approvedBy'),
      DailyClosing.countDocuments(filters),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData, options = {}) {
    return DailyClosing.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      ...options,
    }).populate('warehouse openedBy closedBy approvedBy');
  }

  async deleteById(id) {
    return DailyClosing.findByIdAndDelete(id);
  }
}

module.exports = new DailyClosingRepository();
