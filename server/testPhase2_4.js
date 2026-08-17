const env = require('./src/config/env');
const mongoose = require('mongoose');
const DailyClosing = require('./src/models/dailyClosing.model');
const Warehouse = require('./src/models/warehouse.model');
const User = require('./src/models/user.model');
const Product = require('./src/models/product.model');
const Batch = require('./src/models/batch.model');
const Waste = require('./src/models/waste.model');
require('./src/models/inventoryTransaction.model');
const wasteService = require('./src/services/waste.service');
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
    
    // Clean up
    await DailyClosing.deleteMany({ warehouse: { $in: [warehouse1._id, warehouse2._id] } });
    await Waste.deleteMany({ wasteNumber: { $regex: 'WST-TEST-P24' } });
    await Batch.deleteMany({ batchNumber: { $regex: 'BATCH-TEST-P24' } });

    // Create batches
    const batch1 = await Batch.create({
      batchNumber: 'BATCH-TEST-P24-1',
      product: product._id,
      warehouse: warehouse1._id,
      initialQuantity: 1000,
      availableQuantity: 1000,
      unitCost: 10,
      status: 'active'
    });

    const batch2 = await Batch.create({
      batchNumber: 'BATCH-TEST-P24-2',
      product: product._id,
      warehouse: warehouse2._id,
      initialQuantity: 1000,
      availableQuantity: 1000,
      unitCost: 10,
      status: 'active'
    });

    const d1 = new Date();
    d1.setUTCHours(10, 0, 0, 0);

    const day1 = await dailyClosingService.openDay(warehouse1._id, d1.toISOString(), user._id);
    const day2 = await dailyClosingService.openDay(warehouse2._id, d1.toISOString(), user._id);

    // Helper to create waste
    const createWst = async (whId, bId, date) => {
      return wasteService.create({
        warehouse: whId.toString(),
        wasteDate: date,
        reason: 'Expired items',
        notes: 'Test Waste',
        createdBy: user._id.toString(),
        items: [{
          product: product._id.toString(),
          batch: bId.toString(),
          quantity: 10,
        }]
      });
    };

    console.log('\n--- Phase 2.4: Global Freeze - Waste ---');

    // 1. Create on OPEN -> PASS
    let wst1;
    try {
      wst1 = await createWst(warehouse1._id, batch1._id, d1);
      const updatedBatch = await Batch.findById(batch1._id);
      if (updatedBatch && updatedBatch.availableQuantity === 990) {
        console.log('PASSED Case: Create Waste in OPEN day (Batch deducted successfully)');
      } else {
        console.error('FAILED Case: Create Waste in OPEN day (Regression: Batch not properly deducted)');
      }
    } catch (e) {
      console.error('FAILED Case: Create Waste in OPEN day', e);
    }

    // Freeze warehouse 1 -> RECONCILING
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'RECONCILING' });

    // 2. Create in RECONCILING -> 403
    try {
      await createWst(warehouse1._id, batch1._id, d1);
      console.error('FAILED Case: Create in RECONCILING (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in RECONCILING -> 403');
      else console.error('FAILED Case: Create in RECONCILING', e);
    }

    // Freeze warehouse 1 -> PENDING_APPROVAL
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'PENDING_APPROVAL' });

    // 3. Create in PENDING_APPROVAL -> 403
    try {
      await createWst(warehouse1._id, batch1._id, d1);
      console.error('FAILED Case: Create in PENDING_APPROVAL (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in PENDING_APPROVAL -> 403');
      else console.error('FAILED Case: Create in PENDING_APPROVAL', e);
    }

    // Freeze warehouse 1 -> CLOSED
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'CLOSED' });

    // 4. Create in CLOSED -> 403
    try {
      await createWst(warehouse1._id, batch1._id, d1);
      console.error('FAILED Case: Create in CLOSED (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in CLOSED -> 403');
      else console.error('FAILED Case: Create in CLOSED', e);
    }

    // 5. Cancel in CLOSED -> 403
    if (wst1) {
      try {
        await wasteService.cancel(wst1._id, user._id, 'Test Cancellation');
        console.error('FAILED Case: Cancel in CLOSED (Should have failed)');
      } catch (e) {
        if (e.statusCode === 403) console.log('PASSED Case: Cancel in CLOSED -> 403');
        else console.error('FAILED Case: Cancel in CLOSED', e);
      }
    }

    // 6. Read/List in frozen day -> PASS
    try {
      const list = await wasteService.list();
      console.log('PASSED Case: Read/List in frozen day -> PASS');
    } catch (e) {
      console.error('FAILED Case: Read/List in frozen day', e);
    }

    // 7. Warehouse 2 is still OPEN. Create -> PASS
    try {
      await createWst(warehouse2._id, batch2._id, d1);
      console.log('PASSED Case: Warehouse A frozen, Warehouse B open -> B works');
    } catch (e) {
      console.error('FAILED Case: Warehouse B', e);
    }

    console.log('\nALL PHASE 2.4 TESTS EXECUTED.');
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

runTests();
