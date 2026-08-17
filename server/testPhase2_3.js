const env = require('./src/config/env');
const mongoose = require('mongoose');
const DailyClosing = require('./src/models/dailyClosing.model');
const Warehouse = require('./src/models/warehouse.model');
const User = require('./src/models/user.model');
const Product = require('./src/models/product.model');
const Supplier = require('./src/models/supplier.model');
const Batch = require('./src/models/batch.model');
const Receiving = require('./src/models/receiving.model');
require('./src/models/inventoryTransaction.model');
const receivingService = require('./src/services/receiving.service');
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
    
    let supplier = await Supplier.findOne({ isActive: true });
    if (!supplier) {
      supplier = await Supplier.create({ name: 'Test Supplier', code: 'SUP-TEST', isActive: true });
    }

    // Clean up
    await DailyClosing.deleteMany({ warehouse: { $in: [warehouse1._id, warehouse2._id] } });
    await Receiving.deleteMany({ receivingNumber: { $regex: 'RCV-TEST-P23' } });
    await Batch.deleteMany({ batchNumber: { $regex: 'BATCH-TEST-P23' } });

    const d1 = new Date();
    d1.setUTCHours(10, 0, 0, 0);

    const day1 = await dailyClosingService.openDay(warehouse1._id, d1.toISOString(), user._id);
    const day2 = await dailyClosingService.openDay(warehouse2._id, d1.toISOString(), user._id);

    // Helper to create a receiving
    let batchCounter = 1;
    const createRcv = async (whId, date) => {
      const bNum = 'BATCH-TEST-P23-' + batchCounter++;
      return receivingService.create({
        supplier: supplier._id.toString(),
        warehouse: whId.toString(),
        receivingDate: date,
        createdBy: user._id.toString(),
        notes: 'Test Receiving',
        items: [{
          product: product._id.toString(),
          batchNumber: bNum,
          quantity: 100,
          unitCost: 5,
        }]
      });
    };

    console.log('\n--- Phase 2.3: Global Freeze - Receiving ---');

    // 1. Create on OPEN -> PASS
    let rcv1;
    try {
      rcv1 = await createRcv(warehouse1._id, d1);
      const newBatch = await Batch.findOne({ batchNumber: rcv1.items[0].batchNumber });
      if (newBatch && newBatch.initialQuantity === 100) {
        console.log('PASSED Case: Create Receiving in OPEN day (Batch created successfully)');
      } else {
        console.error('FAILED Case: Create Receiving in OPEN day (Regression: Batch not properly created)');
      }
    } catch (e) {
      console.error('FAILED Case: Create Receiving in OPEN day', e);
    }

    // Freeze warehouse 1 -> RECONCILING
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'RECONCILING' });

    // 2. Create in RECONCILING -> 403
    try {
      await createRcv(warehouse1._id, d1);
      console.error('FAILED Case: Create in RECONCILING (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in RECONCILING -> 403');
      else console.error('FAILED Case: Create in RECONCILING', e);
    }

    // Freeze warehouse 1 -> PENDING_APPROVAL
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'PENDING_APPROVAL' });

    // 3. Create in PENDING_APPROVAL -> 403
    try {
      await createRcv(warehouse1._id, d1);
      console.error('FAILED Case: Create in PENDING_APPROVAL (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in PENDING_APPROVAL -> 403');
      else console.error('FAILED Case: Create in PENDING_APPROVAL', e);
    }

    // Freeze warehouse 1 -> CLOSED
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'CLOSED' });

    // 4. Create in CLOSED -> 403
    try {
      await createRcv(warehouse1._id, d1);
      console.error('FAILED Case: Create in CLOSED (Should have failed)');
    } catch (e) {
      if (e.statusCode === 403) console.log('PASSED Case: Create in CLOSED -> 403');
      else console.error('FAILED Case: Create in CLOSED', e);
    }

    // 5. Cancel in CLOSED -> 403
    if (rcv1) {
      try {
        await receivingService.cancel(rcv1._id, user._id, 'Test Cancellation');
        console.error('FAILED Case: Cancel in CLOSED (Should have failed)');
      } catch (e) {
        if (e.statusCode === 403) console.log('PASSED Case: Cancel in CLOSED -> 403');
        else console.error('FAILED Case: Cancel in CLOSED', e);
      }
    }

    // 6. Read/List in frozen day -> PASS
    try {
      const list = await receivingService.list();
      console.log('PASSED Case: Read/List in frozen day -> PASS');
    } catch (e) {
      console.error('FAILED Case: Read/List in frozen day', e);
    }

    // 7. Warehouse 2 is still OPEN. Create -> PASS
    try {
      await createRcv(warehouse2._id, d1);
      console.log('PASSED Case: Warehouse A frozen, Warehouse B open -> B works');
    } catch (e) {
      console.error('FAILED Case: Warehouse B', e);
    }

    console.log('\nALL PHASE 2.3 TESTS EXECUTED.');
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

runTests();
