const env = require('./src/config/env');
const mongoose = require('mongoose');
const DailyClosing = require('./src/models/dailyClosing.model');
const Warehouse = require('./src/models/warehouse.model');
const User = require('./src/models/user.model');
const Product = require('./src/models/product.model');
const Batch = require('./src/models/batch.model');
const Transfer = require('./src/models/transfer.model');
require('./src/models/inventoryTransaction.model');
const transferService = require('./src/services/transfer.service');
const dailyClosingService = require('./src/services/dailyClosing.service');

async function runTests() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to DB');

    // Setup basic entities
    const warehouse1 = await Warehouse.findOne({ isActive: true });
    let warehouse2 = await Warehouse.findOne({ name: 'Test Warehouse 2' });
    let warehouse3 = await Warehouse.findOne({ name: 'Test Warehouse 3' });
    if (!warehouse3) warehouse3 = await Warehouse.create({ name: 'Test Warehouse 3', code: 'WH3-TEST', isActive: true, type: 'sub' });
    
    const user = await User.findOne();
    const product = await Product.findOne({ isActive: true });
    
    // Clean up
    await DailyClosing.deleteMany({ warehouse: { $in: [warehouse1._id, warehouse2._id, warehouse3._id] } });
    await Transfer.deleteMany({ transferNumber: { $regex: 'TRF-TEST-P26' } });
    await Batch.deleteMany({ batchNumber: { $regex: 'BATCH-TEST-P26' } });

    // Create batches
    const batch1 = await Batch.create({
      batchNumber: 'BATCH-TEST-P26-1',
      product: product._id,
      warehouse: warehouse1._id,
      initialQuantity: 1000,
      availableQuantity: 1000,
      unitCost: 10,
      status: 'active'
    });

    const d1 = new Date();
    d1.setUTCHours(10, 0, 0, 0);

    const day1 = await dailyClosingService.openDay(warehouse1._id, d1.toISOString(), user._id);
    const day2 = await dailyClosingService.openDay(warehouse2._id, d1.toISOString(), user._id);
    const day3 = await dailyClosingService.openDay(warehouse3._id, d1.toISOString(), user._id);

    // Helper to create transfer
    let trfCount = 1;
    const createTrf = async (srcWhId, destWhId, bId, date) => {
      return transferService.create({
        sourceWarehouse: srcWhId.toString(),
        destinationWarehouse: destWhId.toString(),
        transferDate: date,
        notes: 'Test Transfer',
        createdBy: user._id.toString(),
        items: [{
          product: product._id.toString(),
          sourceBatch: bId.toString(),
          destinationBatchNumber: 'BATCH-TEST-P26-DEST' + trfCount++,
          quantity: 10,
        }]
      });
    };

    console.log('\n--- Phase 2.6: Global Freeze - Transfer ---');

    // 1. Create on OPEN -> PASS
    let trf1;
    try {
      trf1 = await createTrf(warehouse1._id, warehouse2._id, batch1._id, d1);
      const updatedSourceBatch = await Batch.findById(batch1._id);
      const destBatch = await Batch.findOne({ batchNumber: trf1.items[0].destinationBatchNumber });
      
      if (updatedSourceBatch.availableQuantity === 990 && destBatch && destBatch.availableQuantity === 10) {
        console.log('PASSED Case: Create Transfer in OPEN day (Source deducted, Dest added)');
      } else {
        console.error('FAILED Case: Create Transfer in OPEN day (Regression in Batch quantity)');
      }
    } catch (e) {
      console.error('FAILED Case: Create Transfer in OPEN day', e);
    }

    // Freeze warehouse 1 -> RECONCILING
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'RECONCILING' });

    // 2. Source Warehouse Frozen -> 403
    try {
      await createTrf(warehouse1._id, warehouse2._id, batch1._id, d1);
      console.error('FAILED Case: Source RECONCILING (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Source RECONCILING -> 403');
      else console.error('FAILED Case: Source RECONCILING', e);
    }

    // Freeze warehouse 1 -> CLOSED
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'CLOSED' });
    try {
      await createTrf(warehouse1._id, warehouse2._id, batch1._id, d1);
      console.error('FAILED Case: Source CLOSED (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Source CLOSED -> 403');
      else console.error('FAILED Case: Source CLOSED', e);
    }

    // 3. Destination Warehouse Frozen -> 403
    // Open warehouse 1, Freeze warehouse 2
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'OPEN' });
    await DailyClosing.findByIdAndUpdate(day2._id, { status: 'PENDING_APPROVAL' });
    try {
      await createTrf(warehouse1._id, warehouse2._id, batch1._id, d1);
      console.error('FAILED Case: Dest PENDING_APPROVAL (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Dest PENDING_APPROVAL -> 403');
      else console.error('FAILED Case: Dest PENDING_APPROVAL', e);
    }
    
    await DailyClosing.findByIdAndUpdate(day2._id, { status: 'CLOSED' });
    try {
      await createTrf(warehouse1._id, warehouse2._id, batch1._id, d1);
      console.error('FAILED Case: Dest CLOSED (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Dest CLOSED -> 403');
      else console.error('FAILED Case: Dest CLOSED', e);
    }

    // 4. Cancel in CLOSED -> 403
    if (trf1) {
      // Freeze warehouse 1 again
      await DailyClosing.findByIdAndUpdate(day1._id, { status: 'CLOSED' });
      try {
        await transferService.cancel(trf1._id, user._id, 'Test Cancellation');
        console.error('FAILED Case: Cancel when Source CLOSED (Should have failed)');
      } catch (e) {
        if (e.statusCode === 403) console.log('PASSED Case: Cancel when Source CLOSED -> 403');
        else console.error('FAILED Case: Cancel when Source CLOSED', e);
      }
    }

    // 5. Read/List in frozen day -> PASS
    try {
      const list = await transferService.list();
      console.log('PASSED Case: Read/List in frozen day -> PASS');
    } catch (e) {
      console.error('FAILED Case: Read/List in frozen day', e);
    }

    // 6. Source and Dest BOTH open -> PASS
    // Day1 is CLOSED, Day2 is CLOSED. Let's create a new batch in day3
    const batch3 = await Batch.create({
      batchNumber: 'BATCH-TEST-P26-3',
      product: product._id,
      warehouse: warehouse3._id,
      initialQuantity: 500,
      availableQuantity: 500,
      unitCost: 10,
      status: 'active'
    });
    
    // Day 3 is OPEN, let's open day 1 again to test (or just use 3 and another warehouse)
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'OPEN' });
    try {
      await createTrf(warehouse3._id, warehouse1._id, batch3._id, d1);
      console.log('PASSED Case: Both OPEN -> Works normally');
    } catch (e) {
      console.error('FAILED Case: Both OPEN', e);
    }

    console.log('\nALL PHASE 2.6 TESTS EXECUTED.');
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

runTests();
