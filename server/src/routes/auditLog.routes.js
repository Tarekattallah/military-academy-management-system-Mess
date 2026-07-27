const express = require('express');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const AuditLog = require('../models/auditLog.model');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/audit-logs  — paginated, filterable
router.get(
  '/',
  authorize('settings:view'),
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 25,
        module,
        action,
        username,
        startDate,
        endDate,
      } = req.query;

      const filter = {};
      if (module) filter.module = module;
      if (action) filter.action = action;
      if (username) filter.username = new RegExp(username, 'i');
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        AuditLog.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/audit-logs/all — clear all logs
router.delete(
  '/all',
  authorize('settings:delete'), // or whatever permission is appropriate, assuming settings:delete for now
  catchAsync(async (req, res) => {
    const result = await AuditLog.deleteMany({});
    res.json({ success: true, message: `تم مسح ${result.deletedCount} سجل بنجاح` });
  })
);

// DELETE /api/v1/audit-logs/:id — delete single log
router.delete(
  '/:id',
  authorize('settings:delete'),
  catchAsync(async (req, res) => {
    const log = await AuditLog.findByIdAndDelete(req.params.id);
    if (!log) {
      // Not using AppError here since catchAsync handles next() but simple json is fine or we can throw AppError
      return res.status(404).json({ success: false, message: 'السجل غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف السجل بنجاح' });
  })
);

module.exports = router;
