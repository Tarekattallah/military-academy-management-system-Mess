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
const MealDistribution = require('../models/mealDistribution.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');
const { signToken } = require('../utils/jwt');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms_test';

let adminToken = '';
let messOfficerToken = '';
let storeKeeperToken = '';

let adminId;
let messOfficerId;
let storeKeeperId;

let warehouseId = '';
let categoryId = '';
let unitKgId = '';
let productChickenId = '';
let batchChickenId = '';
let recipeId = '';
let menuId = '';
let mealRequestId = '';
let reservationId = '';

const OP_DATE = new Date('2026-09-25T12:00:00.000Z');

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
      'recipes:view', 'recipes:create', 'recipes:update',
      'menus:view', 'menus:create',
      'meal-requests:view', 'meal-requests:create', 'meal-requests:approve',
      'reservations:view', 'reservations:create', 'reservations:consume',
      'meal-distributions:view', 'meal-distributions:create', 'meal-distributions:update', 'meal-distributions:complete', 'meal-distributions:cancel',
      'inventory-transactions:view',
    ]
  });

  messOfficerToken = `${env.cookieName}=` + signToken({
    sub: messOfficerId.toString(),
    username: 'mess.officer',
    roles: ['Mess Officer'],
    permissions: [
      'recipes:view', 'recipes:create', 'recipes:update',
      'menus:view', 'menus:create',
      'meal-requests:view', 'meal-requests:create', 'meal-requests:approve',
      'reservations:view', 'reservations:create', 'reservations:consume',
      'meal-distributions:view', 'meal-distributions:create', 'meal-distributions:update', 'meal-distributions:complete', 'meal-distributions:cancel',
      'inventory-transactions:view',
    ]
  });

  storeKeeperToken = `${env.cookieName}=` + signToken({
    sub: storeKeeperId.toString(),
    username: 'store.keeper',
    roles: ['Store Keeper'],
    permissions: [
      'meal-distributions:view',
      'inventory-transactions:view',
    ]
  });

  const wh = await Warehouse.create({ name: 'Kitchen Warehouse', code: 'KW-01', isActive: true });
  warehouseId = wh._id.toString();

  const cat = await Category.create({ name: 'Fresh Poultry', code: 'PLTRY' });
  categoryId = cat._id.toString();

  const uKg = await Unit.create({ name: 'Kilogram', abbreviation: 'kg', type: 'weight', category: 'weight', isActive: true });
  unitKgId = uKg._id.toString();

  const pChicken = await Product.create({ name: 'Chicken Breast', code: 'PRD-CHK', category: categoryId, unit: unitKgId, isActive: true });
  productChickenId = pChicken._id.toString();

  const bChicken = await Batch.create({
    product: productChickenId,
    warehouse: warehouseId,
    batchNumber: 'BATCH-CHK-100',
    initialQuantity: 200,
    availableQuantity: 200,
    reservedQuantity: 0,
    unitCost: 50, // 50 per kg
    expiryDate: new Date('2026-10-15T00:00:00.000Z'),
    status: 'active',
  });
  batchChickenId = bChicken._id.toString();

  const rec = await Recipe.create({
    recipeNumber: 'REC-CHK-01',
    name: 'Grilled Chicken',
    category: categoryId,
    yield: 100, // Yields 100 portions
    standardCost: 2000, // Standard batch cost (20 per portion)
    items: [{ product: productChickenId, quantity: 40, unit: unitKgId }], // 0.4 kg per portion
    createdBy: adminId,
  });
  recipeId = rec._id.toString();

  const menu = await Menu.create({
    menuNumber: 'MENU-CHK-LUNCH',
    menuDate: OP_DATE,
    mealType: 'lunch',
    items: [{ recipe: recipeId, plannedServings: 100 }],
    createdBy: adminId,
  });
  menuId = menu._id.toString();

  const mr = await MealRequest.create({
    requestNumber: 'MR-CHK-01',
    mealType: 'lunch',
    requestDate: OP_DATE,
    menu: menuId,
    requestedBy: adminId,
    status: 'approved',
    requestingUnit: 'Troop Bravo',
    items: [{ recipe: recipeId, requestedServings: 100 }],
    createdBy: adminId,
  });
  mealRequestId = mr._id.toString();

  const res = await Reservation.create({
    reservationNumber: 'RSV-CHK-01',
    mealRequest: mealRequestId,
    warehouse: warehouseId,
    operationalDate: OP_DATE,
    status: 'reserved',
    reservedBy: adminId,
    items: [{
      recipe: recipeId,
      product: productChickenId,
      batch: batchChickenId,
      reservedQuantity: 40,
      consumedQuantity: 0,
    }]
  });
  reservationId = res._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 3.4: Live Meal Distribution, Snapshot Immutability, Atomic Depletion & Variance Costing', () => {
  let distributionId = '';

  it('1. Create Meal Distribution in draft status with immutable recipe snapshot', async () => {
    const res = await request(app)
      .post('/api/v1/meal-distributions')
      .set('Cookie', messOfficerToken)
      .send({
        reservation: reservationId,
        notes: 'Live lunch distribution for Troop Bravo',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.plannedServings).toBe(100);
    expect(res.body.data.recipeSnapshots.length).toBe(1);
    expect(res.body.data.recipeSnapshots[0].recipeName).toBe('Grilled Chicken');
    expect(res.body.data.recipeSnapshots[0].standardCost).toBe(2000);
    expect(res.body.data.recipeSnapshots[0].ingredients.length).toBe(1);
    expect(res.body.data.recipeSnapshots[0].ingredients[0].productName).toBe('Chicken Breast');

    distributionId = res.body.data._id;
  });

  it('2. Recipe Immutability: Modifying master recipe does NOT affect historical distribution snapshot', async () => {
    // Update master recipe name and cost
    await Recipe.findByIdAndUpdate(recipeId, {
      name: 'MODIFIED Spicy Chicken',
      standardCost: 9999,
    });

    // Query distribution from API
    const distRes = await request(app)
      .get(`/api/v1/meal-distributions/${distributionId}`)
      .set('Cookie', messOfficerToken);

    expect(distRes.status).toBe(200);
    expect(distRes.body.data.recipeSnapshots[0].recipeName).toBe('Grilled Chicken');
    expect(distRes.body.data.recipeSnapshots[0].standardCost).toBe(2000);
  });

  it('3. Transition status from draft to in_progress', async () => {
    const res = await request(app)
      .patch(`/api/v1/meal-distributions/${distributionId}/status`)
      .set('Cookie', messOfficerToken)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('4. Block completion when closed-loop reconciliation does not balance (issued != actual + waste + return)', async () => {
    const res = await request(app)
      .post(`/api/v1/meal-distributions/${distributionId}/complete`)
      .set('Cookie', messOfficerToken)
      .send({
        actualServings: 90,
        items: [{
          batch: batchChickenId,
          product: productChickenId,
          issuedQuantity: 40,
          actualQuantity: 30,
          wastageQuantity: 2,
          returnedQuantity: 0, // 30 + 2 + 0 = 32 != 40 (Missing 8 kg!)
        }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Reconciliation failed/i);
  });

  it('5. Block completion when actualServings exceeds plannedServings', async () => {
    const res = await request(app)
      .post(`/api/v1/meal-distributions/${distributionId}/complete`)
      .set('Cookie', messOfficerToken)
      .send({
        actualServings: 150, // planned was 100
        items: [{
          batch: batchChickenId,
          product: productChickenId,
          issuedQuantity: 40,
          actualQuantity: 36,
          wastageQuantity: 2,
          returnedQuantity: 2, // 36 + 2 + 2 = 40 (reconciles, but servings exceed)
        }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Actual servings cannot exceed planned servings/i);
  });

  it('6. Complete live distribution: executes atomic inventory deduction and computes standard vs actual cost variance', async () => {
    // Balanced reconciliation:
    // Issued = 40 kg.
    // Actual consumed = 36 kg (Unit cost = 50 -> Actual Cost = 1800).
    // Wastage = 2 kg (Unit cost = 50 -> Waste Cost = 100).
    // Returned = 2 kg (Returned to inventory without deduction).
    // Actual Servings = 90.
    // Planned Servings = 100 (Standard Cost = 2000, 20/serving).
    // Actual Cost Per Serving = 1800 / 90 = 20.
    // Variance Amount = 1800 - 2000 = -200 (Favorable variance).
    // Operational Cost = 1800 + 100 = 1900.

    const res = await request(app)
      .post(`/api/v1/meal-distributions/${distributionId}/complete`)
      .set('Cookie', messOfficerToken)
      .send({
        actualServings: 90,
        items: [{
          batch: batchChickenId,
          product: productChickenId,
          issuedQuantity: 40,
          actualQuantity: 36,
          wastageQuantity: 2,
          returnedQuantity: 2,
        }],
        notes: 'Completed successfully with 2kg operational waste logged',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.actualServings).toBe(90);
    expect(res.body.data.totalStandardCost).toBe(2000);
    expect(res.body.data.totalActualCost).toBe(1800);
    expect(res.body.data.totalWasteCost).toBe(100);
    expect(res.body.data.operationalCost).toBe(1900);
    expect(res.body.data.varianceAmount).toBe(-200);
    expect(res.body.data.standardCostPerServing).toBe(20);
    expect(res.body.data.actualCostPerServing).toBe(20);

    // ── Verify Atomic Inventory Depletion ─────────────────────────────────
    // Total batch deduction = actual (36) + waste (2) = 38 kg.
    // Initial was 200 kg -> Available should now be 200 - 38 = 162 kg!
    const updatedBatch = await Batch.findById(batchChickenId);
    expect(updatedBatch.availableQuantity).toBe(162);

    // ── Verify Linked Reservation status updated to consumed ──────────────
    const updatedReservation = await Reservation.findById(reservationId);
    expect(updatedReservation.status).toBe('consumed');

    // ── Verify Created Inventory Transactions ─────────────────────────────
    const transactions = await InventoryTransaction.find({ referenceId: distributionId });
    expect(transactions.length).toBe(2);

    const issueTx = transactions.find(t => t.transactionType === 'issue');
    const wasteTx = transactions.find(t => t.transactionType === 'waste');

    expect(issueTx).toBeTruthy();
    expect(issueTx.quantity).toBe(36);
    expect(issueTx.totalCost).toBe(1800);

    expect(wasteTx).toBeTruthy();
    expect(wasteTx.quantity).toBe(2);
    expect(wasteTx.totalCost).toBe(100);
  });

  it('7. Cannot re-complete or cancel an already COMPLETED distribution', async () => {
    const res = await request(app)
      .post(`/api/v1/meal-distributions/${distributionId}/cancel`)
      .set('Cookie', messOfficerToken)
      .send({ reason: 'Try cancel completed' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cannot cancel a distribution with status "completed"/i);
  });

  it('8. Cancelling draft distribution stores cancellation metadata without mutating inventory', async () => {
    // Create new reservation & draft distribution for cancel test
    const mrCancel = await MealRequest.create({
      requestNumber: 'MR-CANCEL-01',
      mealType: 'lunch',
      requestDate: OP_DATE,
      menu: menuId,
      requestedBy: adminId,
      status: 'approved',
      requestingUnit: 'Troop Echo',
      items: [{ recipe: recipeId, requestedServings: 25 }],
      createdBy: adminId,
    });

    const resCancel = await Reservation.create({
      reservationNumber: 'RSV-CANCEL-01',
      mealRequest: mrCancel._id,
      warehouse: warehouseId,
      operationalDate: OP_DATE,
      status: 'reserved',
      reservedBy: adminId,
      items: [{ recipe: recipeId, product: productChickenId, batch: batchChickenId, reservedQuantity: 10, consumedQuantity: 0 }],
    });

    const distCancel = await MealDistribution.create({
      distributionNumber: 'MD-CANCEL-01',
      reservation: resCancel._id,
      mealRequest: mrCancel._id,
      menu: menuId,
      requestingUnit: 'Troop Echo',
      distributionDate: OP_DATE,
      status: 'draft',
      plannedServings: 25,
      recipeSnapshots: [{
        recipe: recipeId,
        recipeName: 'Grilled Chicken',
        recipeNumber: 'REC-CHK-01',
        recipeYield: 100,
        standardCost: 2000,
        ingredients: [{ product: productChickenId, productName: 'Chicken', quantity: 40, unit: unitKgId, unitName: 'kg' }]
      }],
      items: [{ recipe: recipeId, product: productChickenId, batch: batchChickenId, plannedQuantity: 10, actualQuantity: 0 }],
    });

    const bBefore = await Batch.findById(batchChickenId);

    const cancelRes = await request(app)
      .post(`/api/v1/meal-distributions/${distCancel._id}/cancel`)
      .set('Cookie', messOfficerToken)
      .send({ reason: 'Field exercise cancelled due to bad weather' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('cancelled');
    expect(cancelRes.body.data.cancelReason).toBe('Field exercise cancelled due to bad weather');

    // Verify batch quantity was NOT changed
    const bAfter = await Batch.findById(batchChickenId);
    expect(bAfter.availableQuantity).toBe(bBefore.availableQuantity);
  });
});
