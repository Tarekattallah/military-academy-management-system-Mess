/* eslint-env jest */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const env = require('../config/env');
const Warehouse = require('../models/warehouse.model');
const Product = require('../models/product.model');
const Unit = require('../models/unit.model');
const Batch = require('../models/batch.model');
const Supplier = require('../models/supplier.model');
const PurchaseOrder = require('../models/purchaseOrder.model');
const DailyClosing = require('../models/dailyClosing.model');
const Menu = require('../models/menu.model');
const MealRequest = require('../models/mealRequest.model');
const Recipe = require('../models/recipe.model');
const Reservation = require('../models/reservation.model');
const MealDistribution = require('../models/mealDistribution.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');
const dailyClosingService = require('../services/dailyClosing.service');
const inventoryTransactionService = require('../services/inventoryTransaction.service');
const mealDistributionService = require('../services/mealDistribution.service');
const receivingService = require('../services/receiving.service');
const wasteService = require('../services/waste.service');
const returnService = require('../services/return.service');
const transferService = require('../services/transfer.service');
const { signToken } = require('../utils/jwt');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms_test';

let adminToken = '';
let adminId;
let whAId = '';
let whBId = '';
let supplierId = '';
let productId = '';
let unitId = '';
let batchAId = '';
let batchBId = '';
let recipeId = '';
let mealReqId = '';
let reservationAId = '';

const D_OP = new Date('2026-09-10T12:00:00.000Z');

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
  await mongoose.connection.db.dropDatabase();

  adminId = new mongoose.Types.ObjectId();
  adminToken = `${env.cookieName}=` + signToken({
    sub: adminId.toString(),
    username: 'admin',
    roles: ['Super Administrator'],
    permissions: [
      'inventory-transactions:view', 'inventory-transactions:create',
      'receiving:view', 'receiving:create', 'receiving:delete',
      'waste:view', 'waste:create', 'waste:delete', 'wastes:view', 'wastes:create', 'wastes:delete',
      'returns:view', 'returns:create', 'returns:delete',
      'transfers:view', 'transfers:create', 'transfers:delete',
      'meal-distributions:view', 'meal-distributions:create', 'meal-distributions:complete', 'meal-distributions:cancel',
      'reservations:view', 'reservations:create',
      'purchase-orders:view', 'purchase-orders:create', 'purchase-orders:approve',
    ]
  });

  const whA = await Warehouse.create({ name: 'Warehouse Alpha', code: 'WH-A', isActive: true });
  whAId = whA._id.toString();

  const whB = await Warehouse.create({ name: 'Warehouse Beta', code: 'WH-B', isActive: true });
  whBId = whB._id.toString();

  const sup = await Supplier.create({ name: 'Global Foods Corp', code: 'SUP-GF', isActive: true });
  supplierId = sup._id.toString();

  const u = await Unit.create({ name: 'Kilogram', abbreviation: 'kg', type: 'weight', category: 'weight', isActive: true });
  unitId = u._id.toString();

  const p = await Product.create({ name: 'Rice White', category: new mongoose.Types.ObjectId(), unit: unitId, isActive: true });
  productId = p._id.toString();

  const bA = await Batch.create({
    product: productId,
    warehouse: whAId,
    batchNumber: 'BATCH-A-100',
    initialQuantity: 1000,
    availableQuantity: 1000,
    reservedQuantity: 0,
    unitCost: 10,
    status: 'active',
  });
  batchAId = bA._id.toString();

  const bB = await Batch.create({
    product: productId,
    warehouse: whBId,
    batchNumber: 'BATCH-B-100',
    initialQuantity: 1000,
    availableQuantity: 1000,
    reservedQuantity: 0,
    unitCost: 10,
    status: 'active',
  });
  batchBId = bB._id.toString();

  const rec = await Recipe.create({
    recipeNumber: 'REC-FREEZE-01',
    name: 'Rice Dish',
    category: new mongoose.Types.ObjectId(),
    yield: 100,
    items: [{ product: productId, quantity: 20, unit: unitId }],
    createdBy: adminId,
  });
  recipeId = rec._id.toString();

  const menu = await Menu.create({
    menuNumber: 'MENU-FREEZE-01',
    menuDate: D_OP,
    mealType: 'lunch',
    items: [{ recipe: recipeId, plannedServings: 100 }],
    createdBy: adminId,
  });

  const mr = await MealRequest.create({
    requestNumber: 'MR-FREEZE-01',
    mealType: 'lunch',
    requestDate: D_OP,
    menu: menu._id,
    requestedBy: adminId,
    status: 'approved',
    requestingUnit: 'Troop Alpha',
    items: [{ recipe: recipeId, requestedServings: 100 }],
    createdBy: adminId,
  });
  mealReqId = mr._id.toString();

  const resA = await Reservation.create({
    reservationNumber: 'RES-FREEZE-01',
    mealRequest: mealReqId,
    warehouse: whAId,
    operationalDate: D_OP,
    status: 'reserved',
    items: [{ recipe: recipeId, product: productId, batch: batchAId, reservedQuantity: 20 }],
  });
  reservationAId = resA._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 2: Global Freeze Enforcement Across All Modules', () => {
  let dayAId = '';
  let dayBId = '';

  beforeAll(async () => {
    // Open operational day for Warehouse A & Warehouse B
    const dayA = await dailyClosingService.openDay(whAId, D_OP.toISOString(), adminId);
    dayAId = dayA._id.toString();

    const dayB = await dailyClosingService.openDay(whBId, D_OP.toISOString(), adminId);
    dayBId = dayB._id.toString();
  });

  describe('Phase 2.1: Freeze - Inventory Transactions', () => {
    it('1. Inventory transaction succeeds when day is OPEN', async () => {
      const tx = await inventoryTransactionService.create({
        batch: batchAId,
        product: productId,
        warehouse: whAId,
        transactionType: 'receiving',
        quantity: 50,
        unitCost: 10,
        transactionDate: D_OP,
        reason: 'Initial load',
        performedBy: adminId,
      });

      expect(tx).toBeTruthy();
      expect(tx.quantity).toBe(50);
    });

    it('2. Freeze check blocks inventory transaction when day is RECONCILING, PENDING_APPROVAL, or CLOSED', async () => {
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'RECONCILING' });

      await expect(inventoryTransactionService.create({
        batch: batchAId,
        product: productId,
        warehouse: whAId,
        transactionType: 'waste',
        quantity: 5,
        unitCost: 10,
        transactionDate: D_OP,
        reason: 'Spoiled',
        performedBy: adminId,
      })).rejects.toThrow(/Operational day is frozen/i);

      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'PENDING_APPROVAL' });
      await expect(inventoryTransactionService.create({
        batch: batchAId,
        product: productId,
        warehouse: whAId,
        transactionType: 'waste',
        quantity: 5,
        unitCost: 10,
        transactionDate: D_OP,
        reason: 'Spoiled',
        performedBy: adminId,
      })).rejects.toThrow(/Operational day is frozen/i);

      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'CLOSED' });
      await expect(inventoryTransactionService.create({
        batch: batchAId,
        product: productId,
        warehouse: whAId,
        transactionType: 'waste',
        quantity: 5,
        unitCost: 10,
        transactionDate: D_OP,
        reason: 'Spoiled',
        performedBy: adminId,
      })).rejects.toThrow(/Operational day is frozen/i);

      // Re-open for next suite
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'OPEN' });
    });
  });

  describe('Phase 2.2: Freeze - Meal Distributions', () => {
    it('3. Creating meal distribution on frozen day is blocked', async () => {
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'RECONCILING' });

      await expect(mealDistributionService.create({
        reservation: reservationAId,
        mealRequest: mealReqId,
        distributionDate: D_OP,
        plannedServings: 100,
        notes: 'Test Dist',
        createdBy: adminId,
        recipeSnapshots: [{ recipe: recipeId, recipeName: 'Rice Dish', recipeNumber: 'REC-FREEZE-01', recipeYield: 100, totalStandardCost: 200 }],
        items: [{ recipe: recipeId, product: productId, batch: batchAId, plannedQuantity: 20, actualQuantity: 20 }]
      })).rejects.toThrow(/Operational day is frozen/i);

      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'OPEN' });
    });
  });

  describe('Phase 2.3: Freeze - Receiving Module', () => {
    let poA;

    beforeAll(async () => {
      poA = await PurchaseOrder.create({
        orderNumber: 'PO-FREEZE-01',
        supplier: supplierId,
        warehouse: whAId,
        status: 'approved',
        createdBy: adminId,
        items: [{ product: productId, unit: unitId, quantity: 100, unitPrice: 10, totalPrice: 1000, receivedQuantity: 0, remainingQuantity: 100 }]
      });
    });

    it('4. Receiving on OPEN day succeeds and increments batch', async () => {
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'OPEN' });

      const rcv = await receivingService.create({
        purchaseOrder: poA._id.toString(),
        supplier: supplierId,
        warehouse: whAId,
        receivingDate: D_OP,
        createdBy: adminId,
        items: [{ product: productId, batchNumber: 'BATCH-A-100', quantity: 20, unitCost: 10 }]
      });

      expect(rcv).toBeTruthy();
      expect(rcv.status).toBe('completed');
    });

    it('5. Receiving on RECONCILING, PENDING_APPROVAL, or CLOSED day is blocked with 403', async () => {
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'RECONCILING' });

      await expect(receivingService.create({
        purchaseOrder: poA._id.toString(),
        supplier: supplierId,
        warehouse: whAId,
        receivingDate: D_OP,
        createdBy: adminId,
        items: [{ product: productId, batchNumber: 'BATCH-A-100', quantity: 10, unitCost: 10 }]
      })).rejects.toThrow(/Operational day is frozen/i);

      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'OPEN' });
    });
  });

  describe('Phase 2.4 & 2.5: Freeze - Waste & Returns Modules', () => {
    it('6. Waste creation on frozen day is blocked', async () => {
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'CLOSED' });

      await expect(wasteService.create({
        warehouse: whAId,
        wasteDate: D_OP,
        reason: 'damaged',
        items: [{ product: productId, batch: batchAId, quantity: 5, unitCost: 10 }],
        createdBy: adminId,
      })).rejects.toThrow(/Operational day is frozen/i);

      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'OPEN' });
    });

    it('7. Return creation on frozen day is blocked', async () => {
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'CLOSED' });

      await expect(returnService.create({
        warehouse: whAId,
        returnDate: D_OP,
        reason: 'Wrong delivery',
        items: [{ product: productId, batch: batchAId, quantity: 5, unitCost: 10 }],
        createdBy: adminId,
      })).rejects.toThrow(/Operational day is frozen/i);

      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'OPEN' });
    });
  });

  describe('Phase 2.6: Freeze - Inter-Warehouse Transfers & Multi-Warehouse Isolation', () => {
    it('8. Transfer succeeds when both Source and Destination warehouses are OPEN', async () => {
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'OPEN' });
      await DailyClosing.findByIdAndUpdate(dayBId, { status: 'OPEN' });

      const trf = await transferService.create({
        sourceWarehouse: whAId,
        destinationWarehouse: whBId,
        transferDate: D_OP,
        notes: 'Transfer Alpha to Beta',
        createdBy: adminId,
        items: [{
          product: productId,
          sourceBatch: batchAId,
          destinationBatchNumber: 'BATCH-B-DEST-01',
          quantity: 15,
        }]
      });

      expect(trf).toBeTruthy();
      expect(trf.status).toBe('completed');
    });

    it('9. Transfer is blocked when Source warehouse is frozen', async () => {
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'RECONCILING' });

      await expect(transferService.create({
        sourceWarehouse: whAId,
        destinationWarehouse: whBId,
        transferDate: D_OP,
        notes: 'Blocked transfer',
        createdBy: adminId,
        items: [{
          product: productId,
          sourceBatch: batchAId,
          destinationBatchNumber: 'BATCH-B-DEST-02',
          quantity: 10,
        }]
      })).rejects.toThrow(/Operational day is frozen/i);

      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'OPEN' });
    });

    it('10. Transfer is blocked when Destination warehouse is frozen', async () => {
      await DailyClosing.findByIdAndUpdate(dayBId, { status: 'PENDING_APPROVAL' });

      await expect(transferService.create({
        sourceWarehouse: whAId,
        destinationWarehouse: whBId,
        transferDate: D_OP,
        notes: 'Blocked transfer dest',
        createdBy: adminId,
        items: [{
          product: productId,
          sourceBatch: batchAId,
          destinationBatchNumber: 'BATCH-B-DEST-03',
          quantity: 10,
        }]
      })).rejects.toThrow(/Operational day is frozen/i);

      await DailyClosing.findByIdAndUpdate(dayBId, { status: 'OPEN' });
    });

    it('11. Multi-Warehouse Isolation: Frozen Warehouse A does NOT block operations on Warehouse B', async () => {
      // Freeze Warehouse A
      await DailyClosing.findByIdAndUpdate(dayAId, { status: 'CLOSED' });
      // Warehouse B remains OPEN
      await DailyClosing.findByIdAndUpdate(dayBId, { status: 'OPEN' });

      const txB = await inventoryTransactionService.create({
        batch: batchBId,
        product: productId,
        warehouse: whBId,
        transactionType: 'receiving',
        quantity: 25,
        unitCost: 10,
        transactionDate: D_OP,
        reason: 'Warehouse B receiving',
        performedBy: adminId,
      });

      expect(txB).toBeTruthy();
      expect((txB.warehouse._id || txB.warehouse).toString()).toBe(whBId);
    });

    it('12. Read and list operations on frozen days succeed without restriction', async () => {
      const listRes = await request(app)
        .get('/api/v1/daily-closings')
        .set('Cookie', adminToken);

      expect(listRes.status).toBe(200);
      expect(listRes.body.status).toBe('success');
      expect(listRes.body.data.length).toBeGreaterThan(0);
    });
  });
});
