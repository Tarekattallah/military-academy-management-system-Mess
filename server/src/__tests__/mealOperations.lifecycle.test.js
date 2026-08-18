/* eslint-env jest */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const env = require('../config/env');
const Warehouse = require('../models/warehouse.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Unit = require('../models/unit.model');
const Batch = require('../models/batch.model');
const Recipe = require('../models/recipe.model');
const Menu = require('../models/menu.model');
const MealRequest = require('../models/mealRequest.model');
const Reservation = require('../models/reservation.model');
const { signToken } = require('../utils/jwt');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms_test';

let adminToken = '';
let messOfficerToken = '';
let commanderToken = '';
let storeKeeperToken = '';

let adminId;
let messOfficerId;
let commanderId;
let storeKeeperId;

let warehouseId = '';
let categoryId = '';
let unitKgId = '';
let unitLId = '';
let productRiceId = '';
let productOilId = '';
let batchRice1Id = '';
let batchRice2Id = '';
let batchOilId = '';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
  await mongoose.connection.db.dropDatabase();

  adminId = new mongoose.Types.ObjectId();
  messOfficerId = new mongoose.Types.ObjectId();
  commanderId = new mongoose.Types.ObjectId();
  storeKeeperId = new mongoose.Types.ObjectId();

  adminToken = `${env.cookieName}=` + signToken({
    sub: adminId.toString(),
    username: 'admin',
    roles: ['Super Administrator'],
    permissions: [
      'recipes:view', 'recipes:create', 'recipes:update', 'recipes:delete',
      'menus:view', 'menus:create', 'menus:update', 'menus:delete',
      'meal-requests:view', 'meal-requests:create', 'meal-requests:update', 'meal-requests:delete', 'meal-requests:approve',
      'reservations:view', 'reservations:create', 'reservations:update', 'reservations:delete', 'reservations:release', 'reservations:consume',
    ]
  });

  messOfficerToken = `${env.cookieName}=` + signToken({
    sub: messOfficerId.toString(),
    username: 'mess.officer',
    roles: ['Mess Officer'],
    permissions: [
      'recipes:view', 'recipes:create', 'recipes:update', 'recipes:delete',
      'menus:view', 'menus:create', 'menus:update', 'menus:delete',
      'meal-requests:view', 'meal-requests:create', 'meal-requests:update', 'meal-requests:approve',
      'reservations:view', 'reservations:create', 'reservations:update', 'reservations:delete', 'reservations:release', 'reservations:consume',
    ]
  });

  commanderToken = `${env.cookieName}=` + signToken({
    sub: commanderId.toString(),
    username: 'unit.commander',
    roles: ['Unit Commander'],
    permissions: [
      'meal-requests:view', 'meal-requests:create', 'meal-requests:update',
      'menus:view', 'recipes:view',
    ] // Notice: no meal-requests:approve or reservations:create
  });

  storeKeeperToken = `${env.cookieName}=` + signToken({
    sub: storeKeeperId.toString(),
    username: 'store.keeper',
    roles: ['Store Keeper'],
    permissions: [
      'recipes:view', 'menus:view',
    ]
  });

  const wh = await Warehouse.create({ name: 'Mess Depot Alpha', code: 'MDA', isActive: true });
  warehouseId = wh._id.toString();

  const cat = await Category.create({ name: 'Dry Rations', code: 'DRY-RAT' });
  categoryId = cat._id.toString();

  const uKg = await Unit.create({ name: 'Kilogram', abbreviation: 'kg', type: 'weight', category: 'weight', isActive: true });
  unitKgId = uKg._id.toString();

  const uL = await Unit.create({ name: 'Liter', abbreviation: 'L', type: 'volume', category: 'volume', isActive: true });
  unitLId = uL._id.toString();

  const pRice = await Product.create({ name: 'Basmati Rice', code: 'PRD-RICE', category: categoryId, unit: unitKgId, isActive: true });
  productRiceId = pRice._id.toString();

  const pOil = await Product.create({ name: 'Cooking Oil', code: 'PRD-OIL', category: categoryId, unit: unitLId, isActive: true });
  productOilId = pOil._id.toString();

  // Create 2 batches for Rice to test FEFO (First Expiring First Out)
  const bRice1 = await Batch.create({
    product: productRiceId,
    warehouse: warehouseId,
    batchNumber: 'BATCH-RICE-EXP-EARLY',
    initialQuantity: 100,
    availableQuantity: 100,
    reservedQuantity: 0,
    unitCost: 20,
    expiryDate: new Date('2026-10-01T00:00:00.000Z'), // Earliest expiry
    status: 'active',
  });
  batchRice1Id = bRice1._id.toString();

  const bRice2 = await Batch.create({
    product: productRiceId,
    warehouse: warehouseId,
    batchNumber: 'BATCH-RICE-EXP-LATE',
    initialQuantity: 200,
    availableQuantity: 200,
    reservedQuantity: 0,
    unitCost: 22,
    expiryDate: new Date('2026-12-01T00:00:00.000Z'), // Later expiry
    status: 'active',
  });
  batchRice2Id = bRice2._id.toString();

  const bOil = await Batch.create({
    product: productOilId,
    warehouse: warehouseId,
    batchNumber: 'BATCH-OIL-01',
    initialQuantity: 50,
    availableQuantity: 50,
    reservedQuantity: 0,
    unitCost: 40,
    expiryDate: new Date('2026-11-15T00:00:00.000Z'),
    status: 'active',
  });
  batchOilId = bOil._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 3.1 & 3.2 & 3.3: Mess Operations Lifecycle & FEFO Reservation Hardening', () => {
  let recipeId = '';
  let menuId = '';
  let mealRequestId = '';
  let reservationId = '';

  const OP_DATE = new Date('2026-09-20T00:00:00.000Z');

  describe('Phase 3.1: Recipe and Menu Management', () => {
    it('1. Create Recipe with ingredients, yield, and standard cost', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .set('Cookie', messOfficerToken)
        .send({
          recipeNumber: 'REC-PLV-01',
          name: 'Military Pilaf',
          description: 'Standard nutritious pilaf recipe',
          category: categoryId,
          yield: 50, // Yields 50 standard portions
          standardCost: 1500, // Standard batch cost (30 per portion)
          items: [
            { product: productRiceId, quantity: 25, unit: unitKgId }, // 0.5 kg per portion
            { product: productOilId, quantity: 5, unit: unitLId },   // 0.1 L per portion
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipeNumber).toBeTruthy();
      expect(res.body.data.yield).toBe(50);
      expect(res.body.data.items.length).toBe(2);
      recipeId = res.body.data._id;
    });

    it('2. Create and Publish Menu with assigned recipe', async () => {
      const res = await request(app)
        .post('/api/v1/menus')
        .set('Cookie', messOfficerToken)
        .send({
          menuDate: OP_DATE.toISOString(),
          mealType: 'lunch',
          items: [
            { recipe: recipeId, plannedServings: 150 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.menuNumber).toBeTruthy();
      menuId = res.body.data._id;

      // Publish Menu
      const pubRes = await request(app)
        .patch(`/api/v1/menus/${menuId}/status`)
        .set('Cookie', messOfficerToken)
        .send({ status: 'published' });

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('published');
    });
  });

  describe('Phase 3.2: Meal Requests & Separation of Duties', () => {
    it('3. Unit Commander creates meal request in draft status', async () => {
      const res = await request(app)
        .post('/api/v1/meal-requests')
        .set('Cookie', commanderToken)
        .send({
          requestingUnit: 'Battalion 3 - Charlie Co',
          requestDate: OP_DATE.toISOString(),
          menu: menuId,
          items: [
            { recipe: recipeId, requestedServings: 150 },
          ],
          notes: 'Field exercise return lunch',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.items[0].requestedServings).toBe(150);
      mealRequestId = res.body.data._id;
    });

    it('4. Submit meal request for approval', async () => {
      const res = await request(app)
        .patch(`/api/v1/meal-requests/${mealRequestId}/status`)
        .set('Cookie', commanderToken)
        .send({ status: 'submitted' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('submitted');
    });

    it('5. Unit Commander CANNOT approve meal request (Separation of Duties)', async () => {
      const res = await request(app)
        .post(`/api/v1/meal-requests/${mealRequestId}/approve`)
        .set('Cookie', commanderToken)
        .send({});

      expect(res.status).toBe(403);
    });

    it('6. Mess Officer approves meal request', async () => {
      const res = await request(app)
        .post(`/api/v1/meal-requests/${mealRequestId}/approve`)
        .set('Cookie', messOfficerToken)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.approvedBy).toBeTruthy();
    });
  });

  describe('Phase 3.3: Automated FEFO Inventory Reservation', () => {
    it('7. Create Reservation: automatically computes ingredient quantities & selects earliest expiring batches (FEFO)', async () => {
      // Calculation:
      // Requested servings = 150. Recipe yield = 50. Multiplier = 150 / 50 = 3.
      // Required Rice = 25 * 3 = 75 kg.
      // Required Oil = 5 * 3 = 15 L.
      // FEFO Batch Selection:
      // Rice Batch 1 has 100 kg (expires Oct 2026), Rice Batch 2 has 200 kg (expires Dec 2026).
      // Rice Batch 1 is chosen first because of earlier expiry date! 75 kg allocated from Batch 1.
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Cookie', messOfficerToken)
        .send({
          mealRequest: mealRequestId,
          warehouse: warehouseId,
          notes: 'Automated reservation for Battalion 3',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('reserved');
      expect(res.body.data.operationalDate).toBeTruthy();
      expect(res.body.data.items.length).toBe(2);

      // Verify Rice allocation is from Batch 1 (FEFO)
      const riceItem = res.body.data.items.find(i => (i.product._id || i.product).toString() === productRiceId);
      expect(riceItem).toBeTruthy();
      expect((riceItem.batch._id || riceItem.batch).toString()).toBe(batchRice1Id);
      expect(riceItem.reservedQuantity).toBe(75);

      // Verify Oil allocation
      const oilItem = res.body.data.items.find(i => (i.product._id || i.product).toString() === productOilId);
      expect(oilItem).toBeTruthy();
      expect((oilItem.batch._id || oilItem.batch).toString()).toBe(batchOilId);
      expect(oilItem.reservedQuantity).toBe(15);

      reservationId = res.body.data._id;
    });

    it('8. Physical Batch quantity remains unchanged at Reservation stage (Soft-lock only)', async () => {
      const bRice1 = await Batch.findById(batchRice1Id);
      const bOil = await Batch.findById(batchOilId);

      // Physical availableQuantity is NOT depleted until live meal distribution
      expect(bRice1.availableQuantity).toBe(100);
      expect(bOil.availableQuantity).toBe(50);
    });

    it('9. Second Reservation allocates remaining quantity and spills over to next batch in FEFO sequence', async () => {
      // Create second request for 100 servings
      // Multiplier = 100 / 50 = 2.
      // Required Rice = 25 * 2 = 50 kg.
      // Batch 1 has 100 kg total, 75 kg already reserved in Reservation 1 -> 25 kg allocatable.
      // Batch 1 provides 25 kg, and Batch 2 (next FEFO batch) provides remaining 25 kg!
      const mr2 = await MealRequest.create({
        requestNumber: 'MR-FEFO-SPLIT-01',
        mealType: 'lunch',
        requestDate: OP_DATE,
        menu: menuId,
        requestedBy: adminId,
        status: 'approved',
        requestingUnit: 'Battalion 3 - HQ',
        items: [{ recipe: recipeId, requestedServings: 100 }],
        createdBy: adminId,
      });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Cookie', messOfficerToken)
        .send({
          mealRequest: mr2._id.toString(),
          warehouse: warehouseId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify Rice allocation split between Batch 1 and Batch 2
      const riceItems = res.body.data.items.filter(i => (i.product._id || i.product).toString() === productRiceId);
      expect(riceItems.length).toBe(2);

      const splitFromBatch1 = riceItems.find(i => (i.batch._id || i.batch).toString() === batchRice1Id);
      const splitFromBatch2 = riceItems.find(i => (i.batch._id || i.batch).toString() === batchRice2Id);

      expect(splitFromBatch1.reservedQuantity).toBe(25);
      expect(splitFromBatch2.reservedQuantity).toBe(25);

      // Release second reservation to restore logical allocation
      await request(app)
        .post(`/api/v1/reservations/${res.body.data._id}/release`)
        .set('Cookie', messOfficerToken);
    });

    it('10. Insufficient stock rejects reservation creation with descriptive error', async () => {
      // Create request for 5000 servings (exceeds all available stock)
      const mrHuge = await MealRequest.create({
        requestNumber: 'MR-HUGE-01',
        mealType: 'lunch',
        requestDate: OP_DATE,
        menu: menuId,
        requestedBy: adminId,
        status: 'approved',
        requestingUnit: 'Division Brigade',
        items: [{ recipe: recipeId, requestedServings: 5000 }],
        createdBy: adminId,
      });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Cookie', messOfficerToken)
        .send({
          mealRequest: mrHuge._id.toString(),
          warehouse: warehouseId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient inventory/i);
    });
  });
});
