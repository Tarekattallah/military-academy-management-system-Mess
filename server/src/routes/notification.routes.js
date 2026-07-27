const express = require('express');
const authenticate = require('../middlewares/authenticate');
const Batch = require('../models/batch.model');
const Product = require('../models/product.model');
const MealRequest = require('../models/mealRequest.model');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/v1/notifications
 * Returns computed alerts (not stored) for:
 *  - Low stock products (availableQty < minStockLevel)
 *  - Expired batches
 *  - Batches expiring within 7 days
 *  - Pending meal requests awaiting approval
 */
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const notifications = [];

    // 1. Expired batches
    const expiredBatches = await Batch.find({
      status: 'active',
      expiryDate: { $lt: now },
    })
      .populate('product', 'name sku')
      .populate('warehouse', 'name')
      .limit(20)
      .lean();

    for (const b of expiredBatches) {
      notifications.push({
        id: `expired-${b._id}`,
        type: 'error',
        category: 'inventory',
        title: 'دفعة منتهية الصلاحية',
        message: `${b.product?.name} (${b.batchNumber}) في ${b.warehouse?.name} — انتهت صلاحيتها`,
        createdAt: b.expiryDate,
        link: '/batches',
      });
    }

    // 2. Near-expiry batches (within 7 days)
    const nearExpiryBatches = await Batch.find({
      status: 'active',
      expiryDate: { $gte: now, $lte: in7Days },
    })
      .populate('product', 'name sku')
      .populate('warehouse', 'name')
      .limit(20)
      .lean();

    for (const b of nearExpiryBatches) {
      const daysLeft = Math.ceil((new Date(b.expiryDate) - now) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `near-expiry-${b._id}`,
        type: 'warning',
        category: 'inventory',
        title: 'دفعة قريبة الانتهاء',
        message: `${b.product?.name} (${b.batchNumber}) — تنتهي خلال ${daysLeft} يوم`,
        createdAt: b.expiryDate,
        link: '/batches',
      });
    }

    // 3. Low stock products (if product has minStockLevel, check currentStock)
    const CurrentStock = require('../models/currentStock.model');
    const lowStockItems = await CurrentStock.find()
      .populate({
        path: 'product',
        match: { isActive: true },
        select: 'name sku minStockLevel',
      })
      .populate('warehouse', 'name')
      .limit(50)
      .lean();

    for (const cs of lowStockItems) {
      if (!cs.product) continue;
      if (cs.product.minStockLevel > 0 && cs.availableQuantity < cs.product.minStockLevel) {
        notifications.push({
          id: `low-stock-${cs.product._id}-${cs.warehouse._id}`,
          type: 'warning',
          category: 'stock',
          title: 'مخزون منخفض',
          message: `${cs.product.name} في ${cs.warehouse?.name} — المتاح: ${cs.availableQuantity} (الحد الأدنى: ${cs.product.minStockLevel})`,
          createdAt: cs.lastTransactionDate || cs.updatedAt,
          link: '/inventory',
        });
      }
    }

    // 4. Pending meal requests awaiting approval
    const pendingRequests = await MealRequest.find({ status: 'submitted' })
      .limit(10)
      .lean();

    for (const r of pendingRequests) {
      notifications.push({
        id: `pending-request-${r._id}`,
        type: 'info',
        category: 'meals',
        title: 'طلب وجبة بانتظار الموافقة',
        message: `طلب رقم ${r.requestNumber} من ${r.requestingUnit}`,
        createdAt: r.requestDate || r.createdAt,
        link: '/meal-requests',
      });
    }

    // Sort by newest first
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
