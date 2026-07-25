const express = require('express');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const AuditLog = require('../models/auditLog.model');

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

module.exports = router;
