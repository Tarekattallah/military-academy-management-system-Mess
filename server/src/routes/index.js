const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const permissionRoutes = require('./permission.routes');
const categoryRoutes = require('./category.routes');
const unitRoutes = require('./unit.routes');
const supplierRoutes = require('./supplier.routes');
const warehouseRoutes = require('./warehouse.routes');
const productRoutes = require('./product.routes');
const batchRoutes = require('./batch.routes');
const inventoryTransactionRoutes = require('./inventoryTransaction.routes');
const receivingRoutes = require('./receiving.routes');
const transferRoutes = require('./transfer.routes');
const currentStockRoutes = require('./currentStock.routes');
const returnRoutes = require('./return.routes');
const wasteRoutes = require('./waste.routes');
const stockCountRoutes = require('./stockCount.routes');
const recipeRoutes = require('./recipe.routes');
const menuRoutes = require('./menu.routes');
const mealRequestRoutes = require('./mealRequest.routes');
const reservationRoutes = require('./reservation.routes');
const mealDistributionRoutes = require('./mealDistribution.routes');
const reportRoutes = require('./report.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/categories', categoryRoutes);
router.use('/units', unitRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/products', productRoutes);
router.use('/batches', batchRoutes);
router.use('/inventory-transactions', inventoryTransactionRoutes);
router.use('/receiving', receivingRoutes);
router.use('/transfers', transferRoutes);
router.use('/current-stock', currentStockRoutes);
router.use('/returns', returnRoutes);
router.use('/wastes', wasteRoutes);
router.use('/stock-counts', stockCountRoutes);
router.use('/recipes', recipeRoutes);
router.use('/menus', menuRoutes);
router.use('/meal-requests', mealRequestRoutes);
router.use('/reservations', reservationRoutes);
router.use('/meal-distributions', mealDistributionRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
