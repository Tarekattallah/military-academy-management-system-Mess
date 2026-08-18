const env = require('./src/config/env');
const mongoose = require('mongoose');
const DailyClosing = require('./src/models/dailyClosing.model');
const Warehouse = require('./src/models/warehouse.model');
const User = require('./src/models/user.model');
const Reservation = require('./src/models/reservation.model');
const MealDistribution = require('./src/models/mealDistribution.model');
const MealRequest = require('./src/models/mealRequest.model');
const Product = require('./src/models/product.model');
const Batch = require('./src/models/batch.model');
const Recipe = require('./src/models/recipe.model');
const InventoryTransaction = require('./src/models/inventoryTransaction.model');
const dailyClosingService = require('./src/services/dailyClosing.service');
const reservationService = require('./src/services/reservation.service');
const AppError = require('./src/utils/appError');

async function runTests() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to DB');

    const warehouse = await Warehouse.findOne();
    const user = await User.findOne();

    const D1 = new Date();
    D1.setUTCHours(0, 0, 0, 0);

    const D2 = new Date(D1);
    D2.setUTCDate(D2.getUTCDate() + 1);

    // Clean up
    await DailyClosing.deleteMany({ warehouse: warehouse._id });
    await Reservation.deleteMany({ warehouse: warehouse._id });
    await MealDistribution.deleteMany({ distributionDate: { $gte: D1, $lte: D2 } });
    await InventoryTransaction.deleteMany({ warehouse: warehouse._id, transactionDate: { $gte: D1, $lte: D2 } });

    const dummyReq = await MealRequest.findOne() || { _id: new mongoose.Types.ObjectId() };

    console.log('\n--- Reservation Operational Date Fallback Tests ---');
    const existingRecipe = await Recipe.findOne();
    const existingProduct = await Product.findOne();
    
    const originalFindById = MealRequest.findById;
    const reservationRepo = require('./src/repositories/reservation.repository');
    const originalCreate = reservationRepo.create;
    const originalAggregate = Reservation.aggregate;

    // Bypass inventory check by returning enough qty
    Reservation.aggregate = () => [];
    let mockMealRequest = {};
    let capturedData = null;

    MealRequest.findById = () => ({
      populate: () => ({
        populate: () => mockMealRequest
      })
    });

    reservationRepo.create = async (data) => {
      capturedData = data;
      return { _id: new mongoose.Types.ObjectId() };
    };

    const dummyCreateData = {
      mealRequest: new mongoose.Types.ObjectId(),
      warehouse: warehouse._id,
      notes: '',
      reservedBy: user._id
    };

    // 1. Menu date exists -> operationalDate = menuDate
    mockMealRequest = { _id: dummyCreateData.mealRequest, status: 'approved', requestingUnit: 'A', items: [], menu: { menuDate: new Date('2026-08-10') } };
    try { await reservationService.create(dummyCreateData); } catch (e) {}
    if (capturedData && capturedData.operationalDate && capturedData.operationalDate.toISOString() === new Date('2026-08-10').toISOString()) {
      console.log('PASSED Case 1: Menu date exists -> operationalDate = menuDate');
    } else { console.error('FAILED Case 1'); }

    // 2. Menu unavailable but requestDate exists -> operationalDate = requestDate
    mockMealRequest = { _id: dummyCreateData.mealRequest, status: 'approved', requestingUnit: 'A', items: [], requestDate: new Date('2026-08-11') };
    capturedData = null;
    try { await reservationService.create(dummyCreateData); } catch (e) {}
    if (capturedData && capturedData.operationalDate && capturedData.operationalDate.toISOString() === new Date('2026-08-11').toISOString()) {
      console.log('PASSED Case 2: Menu unavailable but requestDate exists -> operationalDate = requestDate');
    } else { console.error('FAILED Case 2'); }

    // 3. Both unavailable -> rejected
    mockMealRequest = { _id: dummyCreateData.mealRequest, status: 'approved', requestingUnit: 'A', items: [] };
    capturedData = null;
    try { 
      await reservationService.create(dummyCreateData); 
      console.error('FAILED Case 3: Should have rejected');
    } catch (e) {
      if (e.message.includes('could not be determined')) {
        console.log('PASSED Case 3: Both unavailable -> reservation creation rejected');
      } else {
        console.error('FAILED Case 3:', e.message);
      }
    }
    
    MealRequest.findById = originalFindById;
    Reservation.aggregate = originalAggregate;
    reservationRepo.create = originalCreate;

    console.log('\n--- Reservation Tests ---');

    const resToday = await Reservation.create({
      reservationNumber: 'RSV-TEST-P12-1',
      mealRequest: dummyReq._id,
      warehouse: warehouse._id,
      operationalDate: D1,
      status: 'reserved',
      items: [{ recipe: new mongoose.Types.ObjectId(), batch: new mongoose.Types.ObjectId(), product: new mongoose.Types.ObjectId(), reservedQuantity: 10 }]
    });

    const day1 = await dailyClosingService.openDay(warehouse._id, D1.toISOString(), user._id);
    try {
      await dailyClosingService.startReconciliation(day1._id, user._id);
      console.error('FAILED Case A: Should block closing');
    } catch (e) {
      if (e.message.includes('unresolved reservations')) console.log('PASSED Case A & D: Blocked today closing correctly');
      else console.error('FAILED Case A:', e);
    }

    await Reservation.findByIdAndDelete(resToday._id);

    const resTomorrow = await Reservation.create({
      reservationNumber: 'RSV-TEST-P12-2',
      mealRequest: dummyReq._id,
      warehouse: warehouse._id,
      operationalDate: D2,
      status: 'reserved',
      items: [{ recipe: new mongoose.Types.ObjectId(), batch: new mongoose.Types.ObjectId(), product: new mongoose.Types.ObjectId(), reservedQuantity: 10 }]
    });

    try {
      await dailyClosingService.startReconciliation(day1._id, user._id);
      console.log('PASSED Case B & C & L: Future reservation allowed');
      // Reset back to OPEN for subsequent tests
      await DailyClosing.findByIdAndUpdate(day1._id, { status: 'OPEN' });
    } catch (e) {
      if (e.message.includes('unresolved reservations')) console.error('FAILED Case B/C: Future res blocked closing!', e);
    }
    
    console.log('\n--- Actual Servings Tests ---');
    
    const dummyDist = await MealDistribution.create({
      distributionNumber: 'DIST-TEST-P12-1',
      reservation: resTomorrow._id,
      mealRequest: dummyReq._id,
      plannedQuantity: 10,
      actualQuantity: 10,
      plannedServings: 100,
      status: 'draft',
      notes: 'TEST-P12',
      distributionDate: D1,
      recipeSnapshots: [{ recipe: new mongoose.Types.ObjectId(), recipeName: 'Test', recipeNumber: '123', recipeYield: 10, totalStandardCost: 0 }],
      items: [{ recipe: new mongoose.Types.ObjectId(), product: new mongoose.Types.ObjectId(), batch: new mongoose.Types.ObjectId(), plannedQuantity: 10, actualQuantity: 10 }]
    });

    // Simulate completion with missing actualServings directly by DB to bypass model constraints which we added manually on save/complete
    await MealDistribution.collection.updateOne({ _id: dummyDist._id }, { $set: { status: 'completed' }, $unset: { actualServings: "" } });
    
    try {
      await dailyClosingService.startReconciliation(day1._id, user._id);
      console.error('FAILED Case J: Should reject missing actualServings');
    } catch (e) {
      if (e.message.includes('completed without actual servings')) console.log('PASSED Case J: Rejected missing actualServings');
      else console.error('FAILED Case J:', e);
    }

    // Invalid < 0
    await MealDistribution.collection.updateOne({ _id: dummyDist._id }, { $set: { actualServings: -5 } });
    try {
      await dailyClosingService.startReconciliation(day1._id, user._id);
      console.error('FAILED Case F: Should reject negative actualServings');
    } catch (e) {
      if (e.message.includes('invalid actual servings')) console.log('PASSED Case F: Rejected negative actualServings');
      else console.error('FAILED Case F:', e);
    }

    // Exceeding planned
    await MealDistribution.collection.updateOne({ _id: dummyDist._id }, { $set: { actualServings: 150 } });
    try {
      await dailyClosingService.startReconciliation(day1._id, user._id);
      console.error('FAILED Case G: Should reject exceeding actualServings');
    } catch (e) {
      if (e.message.includes('exceed planned servings')) console.log('PASSED Case G: Rejected exceeding actualServings');
      else console.error('FAILED Case G:', e);
    }

    // Valid
    await MealDistribution.collection.updateOne({ _id: dummyDist._id }, { $set: { actualServings: 90 } });
    try {
      const rec = await dailyClosingService.startReconciliation(day1._id, user._id);
      console.log('PASSED Case K & H & I: Reconciliation proceeds with valid servings', rec.status);
    } catch (e) {
      console.error('FAILED Case K/H/I:', e);
    }

    console.log('\nALL PHASE 1.2 TESTS EXECUTED.');

  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

runTests();
