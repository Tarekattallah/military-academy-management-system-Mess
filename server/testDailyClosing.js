require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');
const dailyClosingService = require('./src/services/dailyClosing.service');
const DailyClosing = require('./src/models/dailyClosing.model');
const Warehouse = require('./src/models/warehouse.model');
const User = require('./src/models/user.model');
const Reservation = require('./src/models/reservation.model');
require('./src/models/product.model');
require('./src/models/batch.model');
require('./src/models/unit.model');
require('./src/models/inventoryTransaction.model');
require('./src/models/mealDistribution.model');
require('./src/models/mealRequest.model');
require('./src/models/currentStock.model');

async function runTests() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to DB');

  try {
    const warehouse = await Warehouse.findOne();
    const user = await User.findOne();
    const Batch = require('./src/models/batch.model');
    const Product = require('./src/models/product.model');
    const InventoryTransaction = require('./src/models/inventoryTransaction.model');
    const MealRequest = require('./src/models/mealRequest.model');
    
    // Clean up
    await DailyClosing.deleteMany({ warehouse: warehouse._id });
    await Reservation.deleteMany({ reservationNumber: { $regex: /^RES-TEST/ } });
    await InventoryTransaction.deleteMany({ referenceType: 'TEST_ADJ' });

    const D1 = new Date(); D1.setUTCHours(0,0,0,0);
    const D2 = new Date(D1); D2.setUTCDate(D2.getUTCDate() + 1);
    const D3 = new Date(D1); D3.setUTCDate(D3.getUTCDate() + 2);

    // Case A: First Day Open
    console.log('--- Case A: First Day Open ---');
    const day1 = await dailyClosingService.openDay(warehouse._id, D1.toISOString(), user._id);
    console.log('PASSED: First day opened:', day1.logicalDate);

    // Case E: Duplicate Open
    console.log('--- Case E: Duplicate Open ---');
    try {
      await dailyClosingService.openDay(warehouse._id, D1.toISOString(), user._id);
      console.log('FAILED');
    } catch (e) {
      console.log('PASSED: Threw duplicate error');
    }

    // Case C: Previous Day Open -> Next Day Rejected
    console.log('--- Case C: Previous Day Open -> Next Day Rejected ---');
    try {
      await dailyClosingService.openDay(warehouse._id, D2.toISOString(), user._id);
      console.log('FAILED');
    } catch (e) {
      console.log('PASSED: Rejected Next Day Open while Previous is Open ->', e.message);
    }

    // Case D: Previous Day Missing -> Next Day Rejected
    console.log('--- Case D: Previous Day Missing -> Next Day Rejected ---');
    try {
      await dailyClosingService.openDay(warehouse._id, D3.toISOString(), user._id);
      console.log('FAILED');
    } catch (e) {
      console.log('PASSED: Rejected opening day when previous day missing ->', e.message);
    }

    // Prepare mock reservation for checklist tests
    const mealReqId = (await mongoose.model('MealRequest').findOne())._id;
    const resCurr = await Reservation.create({
      reservationNumber: 'RES-TEST-CURR',
      mealRequest: mealReqId,
      warehouse: warehouse._id,
      status: 'reserved',
      createdAt: D1,
      items: [{ recipe: new mongoose.Types.ObjectId(), batch: new mongoose.Types.ObjectId(), product: new mongoose.Types.ObjectId(), reservedQuantity: 1 }]
    });

    const resFuture = await Reservation.create({
      reservationNumber: 'RES-TEST-FUT',
      mealRequest: mealReqId,
      warehouse: warehouse._id,
      status: 'reserved',
      createdAt: D2, // Future
      items: [{ recipe: new mongoose.Types.ObjectId(), batch: new mongoose.Types.ObjectId(), product: new mongoose.Types.ObjectId(), reservedQuantity: 1 }]
    });

    // Case G: Unresolved Current-Day Reservation -> Rejected
    console.log('--- Case G: Unresolved Current-Day Reservation -> Rejected ---');
    try {
      await dailyClosingService.startReconciliation(day1._id, user._id);
      console.log('FAILED');
    } catch (e) {
      console.log('PASSED: Rejected Reconcile due to unresolved reservation');
    }

    // Fix current-day reservation
    resCurr.status = 'consumed'; await resCurr.save();

    // Case J: Stock Reconciliation FAIL
    console.log('--- Case J: Stock Reconciliation FAIL ---');
    // Create a fake transaction that shouldn't exist in stock, causing discrepancy
    const testBatch = await Batch.findOne({ warehouse: warehouse._id, status: 'active' });
    const fakeTx = await InventoryTransaction.create({
      batch: testBatch._id,
      product: testBatch.product,
      warehouse: warehouse._id,
      transactionType: 'adjustment',
      module: 'manual',
      quantity: 999, // Big diff
      referenceType: 'TEST_ADJ',
      performedBy: user._id,
      transactionDate: D1
    });

    try {
      await dailyClosingService.startReconciliation(day1._id, user._id);
      console.log('FAILED');
    } catch (e) {
      console.log('PASSED: Reconcile rejected due to stock discrepancy ->', e.message);
    }

    // Clean fake Tx
    await InventoryTransaction.findByIdAndDelete(fakeTx._id);

    // Case I & H: Stock Reconciliation PASS & Future Reservation Allowed
    console.log('--- Case I & H: Stock Recon PASS & Future Res Allowed ---');
    const recDay1 = await dailyClosingService.startReconciliation(day1._id, user._id);
    console.log('PASSED: Reconciling successfully, status:', recDay1.status);

    // Case L: Successful Submit
    console.log('--- Case L: Successful Submit ---');
    const subDay1 = await dailyClosingService.submitForApproval(day1._id, user._id, 'All good');
    console.log('PASSED: Submitted, status:', subDay1.status);

    // Case O: Freeze Check -> Rejected
    console.log('--- Case O: Freeze Check -> Rejected ---');
    try {
      await dailyClosingService.assertOperationalDayWritable(warehouse._id, D1);
      console.log('FAILED');
    } catch (e) {
      console.log('PASSED: Threw freeze error ->', e.message);
    }

    // Case M: Successful Close
    console.log('--- Case M: Successful Close ---');
    const closedDay1 = await dailyClosingService.approveAndClose(day1._id, user._id, 'Approved');
    console.log('PASSED: Closed successfully, status:', closedDay1.status);

    // Case N: Close Twice -> Rejected
    console.log('--- Case N: Close Twice -> Rejected ---');
    try {
      await dailyClosingService.approveAndClose(day1._id, user._id, 'Approved');
      console.log('FAILED');
    } catch (e) {
      console.log('PASSED: Cannot approve from CLOSED');
    }

    // Case B & K: Previous Day Closed -> Next Day Open & Zero-Operation Day
    console.log('--- Case B & K: Prev Day Closed -> Next Day Open & Zero-Op Day ---');
    const day2 = await dailyClosingService.openDay(warehouse._id, D2.toISOString(), user._id);
    console.log('PASSED: Day 2 opened successfully:', day2.logicalDate);
    
    // Clean up future reservation so it doesn't block Day 2
    await Reservation.findByIdAndDelete(resFuture._id);

    const recDay2 = await dailyClosingService.startReconciliation(day2._id, user._id);
    const subDay2 = await dailyClosingService.submitForApproval(day2._id, user._id);
    const closedDay2 = await dailyClosingService.approveAndClose(day2._id, user._id);
    console.log('PASSED: Zero-operation Day 2 Closed successfully:', closedDay2.status);

    console.log('\nALL TESTS EXECUTED.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

runTests();
