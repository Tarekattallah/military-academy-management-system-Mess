/* eslint-env jest */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const env = require('../config/env');
const Warehouse = require('../models/warehouse.model');
const Product = require('../models/product.model');
const Unit = require('../models/unit.model');
const Batch = require('../models/batch.model');
const User = require('../models/user.model');
const DailyClosing = require('../models/dailyClosing.model');
const Reservation = require('../models/reservation.model');
const Menu = require('../models/menu.model');
const MealRequest = require('../models/mealRequest.model');
const MealDistribution = require('../models/mealDistribution.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');
const { signToken } = require('../utils/jwt');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms_test';

let adminToken = '';
let messOfficerToken = '';
let storeKeeperToken = '';
let warehouseId = '';
let productId = '';
let unitId = '';
let batchId = '';
let adminId;
let messOfficerId;
let storeKeeperId;

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
  await mongoose.connection.db.dropDatabase();

  adminId = new mongoose.Types.ObjectId();
  messOfficerId = new mongoose.Types.ObjectId();
  storeKeeperId = new mongoose.Types.ObjectId();

  adminToken = `${env.cookieName}=` + signToken({
    sub: adminId.toString(),
    username: 'admin',
    roles: ['Super Administrator'],
    permissions: [
      'inventory-transactions:view',
      'stock-counts:approve',
      'reservations:view',
      'meal-distributions:view',
    ]
  });

  messOfficerToken = `${env.cookieName}=` + signToken({
    sub: messOfficerId.toString(),
    username: 'mess.officer',
    roles: ['Mess Officer'],
    permissions: [
      'inventory-transactions:view',
      'reservations:view',
      'meal-distributions:view',
    ]
  });

  storeKeeperToken = `${env.cookieName}=` + signToken({
    sub: storeKeeperId.toString(),
    username: 'store.keeper',
    roles: ['Store Keeper'],
    permissions: [
      'inventory-transactions:view',
    ]
  });

  const wh = await Warehouse.create({ name: 'Central Warehouse', code: 'WH-MAIN', isActive: true });
  warehouseId = wh._id.toString();

  const unit = await Unit.create({ name: 'Kilogram', abbreviation: 'kg', type: 'weight', category: 'weight', isActive: true });
  unitId = unit._id.toString();

  const product = await Product.create({ name: 'Beef Cut', category: new mongoose.Types.ObjectId(), unit: unitId, isActive: true });
  productId = product._id.toString();

  const batch = await Batch.create({
    product: productId,
    warehouse: warehouseId,
    batchNumber: 'BATCH-INIT-01',
    initialQuantity: 100,
    availableQuantity: 100,
    reservedQuantity: 0,
    unitCost: 15,
    status: 'active',
  });
  batchId = batch._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 2.0: Daily Closing Lifecycle Hardening & Validation', () => {
  let day1Id = '';
  const D1 = new Date('2026-09-01T00:00:00.000Z');
  const D2 = new Date('2026-09-02T00:00:00.000Z');
  const D3 = new Date('2026-09-03T00:00:00.000Z');

  describe('Day 1 Opening & Sequential Integrity', () => {
    it('1. Open first operational day (D1) with initial stock snapshot', async () => {
      const res = await request(app)
        .post('/api/v1/daily-closings/open')
        .set('Cookie', messOfficerToken)
        .send({
          warehouse: warehouseId,
          logicalDate: D1.toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.openingStockSnapshot.length).toBe(1);
      expect(res.body.data.openingStockSnapshot[0].quantity).toBe(100);
      expect(res.body.data.openingStockSnapshot[0].unitCost).toBe(15);
      expect(res.body.data.openingStockSnapshot[0].totalValue).toBe(1500);
      day1Id = res.body.data._id;
    });

    it('2. Reject duplicate open for same warehouse and date', async () => {
      const res = await request(app)
        .post('/api/v1/daily-closings/open')
        .set('Cookie', messOfficerToken)
        .send({
          warehouse: warehouseId,
          logicalDate: D1.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('3. Reject opening D2 while D1 is still OPEN', async () => {
      const res = await request(app)
        .post('/api/v1/daily-closings/open')
        .set('Cookie', messOfficerToken)
        .send({
          warehouse: warehouseId,
          logicalDate: D2.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/must be CLOSED first/i);
    });

    it('4. Reject opening D3 when previous day D2 is missing', async () => {
      const res = await request(app)
        .post('/api/v1/daily-closings/open')
        .set('Cookie', messOfficerToken)
        .send({
          warehouse: warehouseId,
          logicalDate: D3.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/missing|sequentially/i);
    });
  });

  describe('Reconciliation Checklist Validations', () => {
    let dummyMealReqId;
    let resCurrentId;
    let resFutureId;

    beforeAll(async () => {
      const menu = await Menu.create({
        menuNumber: 'MENU-CHECK-01',
        menuDate: D1,
        mealType: 'lunch',
        items: [{ recipe: new mongoose.Types.ObjectId(), plannedServings: 50 }],
        createdBy: adminId,
      });

      const mealReq = await MealRequest.create({
        requestNumber: 'REQ-CHECK-01',
        mealType: 'lunch',
        requestDate: D1,
        menu: menu._id,
        requestedBy: adminId,
        status: 'approved',
        requestingUnit: 'Brigade 1',
        items: [{ recipe: menu.items[0].recipe, requestedServings: 50 }],
        createdBy: adminId,
      });
      dummyMealReqId = mealReq._id;

      const rCurr = await Reservation.create({
        reservationNumber: 'RES-CHECK-CURR',
        mealRequest: dummyMealReqId,
        warehouse: warehouseId,
        operationalDate: D1,
        status: 'reserved',
        items: [{ recipe: menu.items[0].recipe, product: productId, batch: batchId, reservedQuantity: 10 }]
      });
      resCurrentId = rCurr._id;

      const rFut = await Reservation.create({
        reservationNumber: 'RES-CHECK-FUT',
        mealRequest: dummyMealReqId,
        warehouse: warehouseId,
        operationalDate: D2,
        status: 'reserved',
        items: [{ recipe: menu.items[0].recipe, product: productId, batch: batchId, reservedQuantity: 10 }]
      });
      resFutureId = rFut._id;
    });

    it('5. Block reconciliation when unresolved reservation exists on D1', async () => {
      const res = await request(app)
        .post(`/api/v1/daily-closings/${day1Id}/reconcile`)
        .set('Cookie', messOfficerToken);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unresolved reservations/i);
    });

    it('6. Block reconciliation when completed meal distribution has actualServings exceeding planned', async () => {
      // Mark reservation as consumed
      await Reservation.findByIdAndUpdate(resCurrentId, { status: 'consumed' });

      const dist = await MealDistribution.create({
        distributionNumber: 'DIST-CHECK-02',
        reservation: resCurrentId,
        mealRequest: dummyMealReqId,
        distributionDate: D1,
        plannedServings: 50,
        actualServings: 80, // exceeds 50
        status: 'completed',
        recipeSnapshots: [{
          recipe: new mongoose.Types.ObjectId(),
          recipeName: 'Meal',
          recipeNumber: 'R1',
          recipeYield: 50,
          standardCost: 500,
          ingredients: [{ productName: 'Beef', quantity: 10, unitName: 'kg' }]
        }],
        items: [{ recipe: new mongoose.Types.ObjectId(), product: productId, batch: batchId, plannedQuantity: 10, actualQuantity: 10 }]
      });

      const res = await request(app)
        .post(`/api/v1/daily-closings/${day1Id}/reconcile`)
        .set('Cookie', messOfficerToken);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceed planned servings/i);

      await MealDistribution.findByIdAndDelete(dist._id);
    });

    it('7. Block reconciliation when physical stock does not match transaction deltas (discrepancy)', async () => {
      // Inject transaction without mutating batch
      const fakeTx = await InventoryTransaction.create({
        batch: batchId,
        product: productId,
        warehouse: warehouseId,
        transactionType: 'adjustment',
        module: 'manual',
        quantity: 50, // creates discrepancy
        referenceType: 'StockCount',
        referenceId: new mongoose.Types.ObjectId(),
        performedBy: adminId,
        transactionDate: D1
      });

      const res = await request(app)
        .post(`/api/v1/daily-closings/${day1Id}/reconcile`)
        .set('Cookie', messOfficerToken);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/discrepancies/i);

      await InventoryTransaction.findByIdAndDelete(fakeTx._id);
    });

    it('8. Successfully start reconciliation when checklist and stock match (future reservation allowed)', async () => {
      // Add valid completed meal distribution for D1
      await MealDistribution.create({
        distributionNumber: 'DIST-CHECK-03',
        reservation: resCurrentId,
        mealRequest: dummyMealReqId,
        distributionDate: D1,
        plannedServings: 50,
        actualServings: 45,
        totalStandardCost: 500,
        totalActualCost: 480,
        totalWasteCost: 20,
        operationalCost: 500,
        varianceAmount: -20,
        status: 'completed',
        completedAt: D1,
        recipeSnapshots: [{
          recipe: new mongoose.Types.ObjectId(),
          recipeName: 'Meal',
          recipeNumber: 'R1',
          recipeYield: 50,
          standardCost: 500,
          ingredients: [{ productName: 'Beef', quantity: 10, unitName: 'kg' }]
        }],
        items: [{ recipe: new mongoose.Types.ObjectId(), product: productId, batch: batchId, plannedQuantity: 10, actualQuantity: 10 }]
      });

      const res = await request(app)
        .post(`/api/v1/daily-closings/${day1Id}/reconcile`)
        .set('Cookie', messOfficerToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('RECONCILING');
      expect(res.body.data.mealSummary.plannedMeals).toBe(50);
      expect(res.body.data.mealSummary.actualMeals).toBe(45);
      expect(res.body.data.mealSummary.executionRate).toBe(90);
      expect(res.body.data.costSummary.totalStandardCost).toBe(500);
      expect(res.body.data.costSummary.totalActualCost).toBe(480);
      expect(res.body.data.costSummary.varianceAmount).toBe(-20);
    });
  });

  describe('Submit, Approve, and Close Flow', () => {
    it('9. Submit reconciliation for approval', async () => {
      const res = await request(app)
        .post(`/api/v1/daily-closings/${day1Id}/submit`)
        .set('Cookie', messOfficerToken)
        .send({ notes: 'Reconciliation verified without variance.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('PENDING_APPROVAL');
      expect(res.body.data.notes).toBe('Reconciliation verified without variance.');
    });

    it('10. Unprivileged user without approve permission cannot approve closing', async () => {
      const res = await request(app)
        .post(`/api/v1/daily-closings/${day1Id}/approve`)
        .set('Cookie', storeKeeperToken)
        .send({ notes: 'Approve test' });

      expect(res.status).toBe(403);
    });

    it('11. Administrator approves and permanently closes operational day', async () => {
      const res = await request(app)
        .post(`/api/v1/daily-closings/${day1Id}/approve`)
        .set('Cookie', adminToken)
        .send({ notes: 'Approved by Administrator.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('CLOSED');
      expect(res.body.data.closedAt).toBeTruthy();
      expect(res.body.data.approvedBy).toBeTruthy();
    });

    it('12. Cannot re-approve or modify an already CLOSED operational day', async () => {
      const res = await request(app)
        .post(`/api/v1/daily-closings/${day1Id}/approve`)
        .set('Cookie', adminToken)
        .send({ notes: 'Re-approve test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot approve from status CLOSED/i);
    });
  });

  describe('Day 2 Sequential Open & Zero-Operation Closing', () => {
    let day2Id = '';

    it('13. Open Day 2 successfully after Day 1 is CLOSED', async () => {
      const res = await request(app)
        .post('/api/v1/daily-closings/open')
        .set('Cookie', messOfficerToken)
        .send({
          warehouse: warehouseId,
          logicalDate: D2.toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('OPEN');
      day2Id = res.body.data._id;
    });

    it('14. Zero-operation day reconciles and closes smoothly', async () => {
      // Clean up any remaining future reservation
      await Reservation.deleteMany({ warehouse: warehouseId });

      const recRes = await request(app)
        .post(`/api/v1/daily-closings/${day2Id}/reconcile`)
        .set('Cookie', messOfficerToken);
      expect(recRes.status).toBe(200);
      expect(recRes.body.data.status).toBe('RECONCILING');

      const subRes = await request(app)
        .post(`/api/v1/daily-closings/${day2Id}/submit`)
        .set('Cookie', messOfficerToken)
        .send({ notes: 'Zero activity day.' });
      expect(subRes.status).toBe(200);
      expect(subRes.body.data.status).toBe('PENDING_APPROVAL');

      const appRes = await request(app)
        .post(`/api/v1/daily-closings/${day2Id}/approve`)
        .set('Cookie', adminToken)
        .send({ notes: 'Closed zero activity day.' });
      expect(appRes.status).toBe(200);
      expect(appRes.body.data.status).toBe('CLOSED');
    });
  });
});
