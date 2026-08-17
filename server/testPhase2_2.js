const env = require('./src/config/env');
const mongoose = require('mongoose');
const DailyClosing = require('./src/models/dailyClosing.model');
const Warehouse = require('./src/models/warehouse.model');
const User = require('./src/models/user.model');
const Product = require('./src/models/product.model');
const Batch = require('./src/models/batch.model');
const Recipe = require('./src/models/recipe.model');
const MealRequest = require('./src/models/mealRequest.model');
const Reservation = require('./src/models/reservation.model');
const MealDistribution = require('./src/models/mealDistribution.model');
require('./src/models/unit.model');
require('./src/models/menu.model');
require('./src/models/inventoryTransaction.model');
const mealDistributionService = require('./src/services/mealDistribution.service');
const dailyClosingService = require('./src/services/dailyClosing.service');

async function runTests() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to DB');

    // Setup basic entities
    const warehouse1 = await Warehouse.findOne({ isActive: true });
    let warehouse2 = await Warehouse.findOne({ name: 'Test Warehouse 2' });
    const user = await User.findOne();
    const product = await Product.findOne({ isActive: true });
    const recipe = await Recipe.findOne();

    // Clean up
    await DailyClosing.deleteMany({ warehouse: { $in: [warehouse1._id, warehouse2._id] } });
    await MealDistribution.deleteMany({ distributionNumber: { $regex: 'MD-TEST-P22' } });
    await Reservation.deleteMany({ reservationNumber: { $regex: 'RSV-TEST-P22' } });
    await Batch.deleteMany({ batchNumber: { $regex: 'BATCH-TEST-P22' } });

    // Ensure we have a valid batch
    const batch1 = await Batch.create({
      batchNumber: 'BATCH-TEST-P22-1',
      product: product._id,
      warehouse: warehouse1._id,
      initialQuantity: 1000,
      availableQuantity: 1000,
      unitCost: 10,
      expirationDate: new Date(Date.now() + 86400000 * 30),
      status: 'active'
    });

    const batch2 = await Batch.create({
      batchNumber: 'BATCH-TEST-P22-2',
      product: product._id,
      warehouse: warehouse2._id,
      initialQuantity: 1000,
      availableQuantity: 1000,
      unitCost: 10,
      expirationDate: new Date(Date.now() + 86400000 * 30),
      status: 'active'
    });

    const d1 = new Date();
    d1.setUTCHours(10, 0, 0, 0);

    const mealReq = await MealRequest.findOne() || { _id: new mongoose.Types.ObjectId(), items: [] };

    // Helper to create reservation
    const createRes = async (whId, bId, num) => {
      return Reservation.create({
        reservationNumber: 'RSV-TEST-P22-' + num,
        mealRequest: mealReq._id,
        warehouse: whId,
        operationalDate: d1,
        status: 'reserved',
        items: [{ recipe: recipe._id, product: product._id, batch: bId, reservedQuantity: 10 }]
      });
    };

    let resCount = 1;
    const resA = await createRes(warehouse1._id, batch1._id, resCount++); // For testing CREATE success
    const resB = await createRes(warehouse1._id, batch1._id, resCount++); // For testing CREATE freeze
    const resC = await createRes(warehouse1._id, batch1._id, resCount++); // For testing COMPLETE success
    const resD = await createRes(warehouse1._id, batch1._id, resCount++); // For testing COMPLETE freeze
    const resE = await createRes(warehouse2._id, batch2._id, resCount++); // For testing WH2 open
    
    // For complete test, we need them to be created before freeze
    // Let's create MD for resC and resD now, while OPEN
    const day1 = await dailyClosingService.openDay(warehouse1._id, d1.toISOString(), user._id);
    const day2 = await dailyClosingService.openDay(warehouse2._id, d1.toISOString(), user._id);

    console.log('\n--- Phase 2.2: Global Freeze - Meal Distribution ---');

    // 1. Create on OPEN -> PASS
    let distA, distC, distD;
    try {
      distA = await mealDistributionService.create({ reservation: resA._id, distributionDate: d1, distributedBy: user._id });
      console.log('PASSED Case: Create in OPEN day');
    } catch (e) { console.error('FAILED Case: Create in OPEN day', e); }

    try {
      distC = await mealDistributionService.create({ reservation: resC._id, distributionDate: d1, distributedBy: user._id });
      distD = await mealDistributionService.create({ reservation: resD._id, distributionDate: d1, distributedBy: user._id });
    } catch (e) {}

    // Complete distC on OPEN -> PASS
    try {
      await mealDistributionService.complete(distC._id, {
        actualServings: 10,
        items: [{ batch: batch1._id, product: product._id, issuedQuantity: 10, actualQuantity: 10, wastageQuantity: 0, returnedQuantity: 0 }]
      }, user._id);
      
      const finishedDist = await MealDistribution.findById(distC._id);
      if (finishedDist.status === 'completed' && finishedDist.operationalCost > 0) {
        console.log('PASSED Case: Complete in OPEN day (Closed-Loop & Costing no regression)');
      } else {
        console.error('FAILED Case: Complete in OPEN day (Costing failed)');
      }
    } catch (e) { console.error('FAILED Case: Complete in OPEN day', e); }


    // Freeze warehouse 1 -> RECONCILING
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'RECONCILING' });

    // 2. Create in RECONCILING -> 403
    try {
      await mealDistributionService.create({ reservation: resB._id, distributionDate: d1, distributedBy: user._id });
      console.error('FAILED Case: Create in RECONCILING (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in RECONCILING -> 403');
      else console.error('FAILED Case: Create in RECONCILING', e);
    }

    // 3. Complete in frozen -> 403
    try {
      await mealDistributionService.complete(distD._id, {
        actualServings: 10,
        items: [{ batch: batch1._id, product: product._id, issuedQuantity: 10, actualQuantity: 10, wastageQuantity: 0, returnedQuantity: 0 }]
      }, user._id);
      console.error('FAILED Case: Complete in frozen day (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Complete in frozen day -> 403');
      else console.error('FAILED Case: Complete in frozen day', e);
    }

    // Freeze warehouse 1 -> PENDING_APPROVAL
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'PENDING_APPROVAL' });
    try {
      await mealDistributionService.create({ reservation: resB._id, distributionDate: d1, distributedBy: user._id });
      console.error('FAILED Case: Create in PENDING_APPROVAL (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in PENDING_APPROVAL -> 403');
      else console.error('FAILED Case: Create in PENDING_APPROVAL', e);
    }

    // Freeze warehouse 1 -> CLOSED
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'CLOSED' });
    try {
      await mealDistributionService.create({ reservation: resB._id, distributionDate: d1, distributedBy: user._id });
      console.error('FAILED Case: Create in CLOSED (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in CLOSED -> 403');
      else console.error('FAILED Case: Create in CLOSED', e);
    }

    // Read/List in frozen day -> PASS
    try {
      const list = await mealDistributionService.list();
      console.log('PASSED Case: Read/List in frozen day -> PASS');
    } catch (e) {
      console.error('FAILED Case: Read/List in frozen day', e);
    }

    // Warehouse 2 is still OPEN. Create -> PASS
    try {
      await mealDistributionService.create({ reservation: resE._id, distributionDate: d1, distributedBy: user._id });
      console.log('PASSED Case: Warehouse A frozen, Warehouse B open -> B works');
    } catch (e) {
      console.error('FAILED Case: Warehouse B', e);
    }

    console.log('\nALL PHASE 2.2 TESTS EXECUTED.');
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

runTests();
