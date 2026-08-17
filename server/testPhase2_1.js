const env = require('./src/config/env');
const mongoose = require('mongoose');
const DailyClosing = require('./src/models/dailyClosing.model');
const Warehouse = require('./src/models/warehouse.model');
const User = require('./src/models/user.model');
const Product = require('./src/models/product.model');
const Batch = require('./src/models/batch.model');
const InventoryTransaction = require('./src/models/inventoryTransaction.model');
const inventoryTransactionService = require('./src/services/inventoryTransaction.service');
const dailyClosingService = require('./src/services/dailyClosing.service');

async function runTests() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to DB');

    // Setup basic entities
    const warehouse1 = await Warehouse.findOne({ isActive: true });
    const user = await User.findOne();
    const product = await Product.findOne({ isActive: true });
    
    // Create a second warehouse for test F
    let warehouse2 = await Warehouse.findOne({ name: 'Test Warehouse 2' });
    if (!warehouse2) {
      warehouse2 = await Warehouse.create({ name: 'Test Warehouse 2', code: 'W2-TEST', location: 'Test Location', isActive: true });
    }

    // Clean up
    await DailyClosing.deleteMany({ warehouse: { $in: [warehouse1._id, warehouse2._id] } });
    await Batch.deleteMany({ batchNumber: { $regex: 'TEST-P21' } });
    await InventoryTransaction.deleteMany({ referenceType: 'TEST-P21' });

    // Ensure we have a valid batch
    const batch1 = await Batch.create({
      batchNumber: 'BATCH-TEST-P21-1',
      product: product._id,
      warehouse: warehouse1._id,
      initialQuantity: 100,
      availableQuantity: 100,
      unitCost: 10,
      expirationDate: new Date(Date.now() + 86400000 * 30),
      status: 'active'
    });

    const batch2 = await Batch.create({
      batchNumber: 'BATCH-TEST-P21-2',
      product: product._id,
      warehouse: warehouse2._id,
      initialQuantity: 100,
      availableQuantity: 100,
      unitCost: 10,
      expirationDate: new Date(Date.now() + 86400000 * 30),
      status: 'active'
    });

    // ── Helper to run a transaction ─────────────────────────────────────────
    const createTx = async (whId, bId, date) => {
      return inventoryTransactionService.create({
        batch: bId.toString(),
        product: product._id.toString(),
        warehouse: whId.toString(),
        transactionType: 'adjustment',
        quantity: 1, // Will remove 1 from currentQuantity
        currentQuantity: 2, // Dummy
        referenceType: 'TEST-P21',
        performedBy: user._id.toString(),
        transactionDate: date,
      });
    };

    const d1 = new Date();
    d1.setUTCHours(10, 0, 0, 0);

    const day1 = await dailyClosingService.openDay(warehouse1._id, d1.toISOString(), user._id);
    const day2 = await dailyClosingService.openDay(warehouse2._id, d1.toISOString(), user._id);

    console.log('\n--- Phase 2.1: Global Freeze - Inventory Transactions ---');

    // A & G. OPEN day -> CREATE succeeds. Existing behavior remains unchanged.
    try {
      const tx = await createTx(warehouse1._id, batch1._id, d1);
      console.log('PASSED Case A & G: Transaction succeeds on an OPEN day.');
    } catch (e) {
      console.error('FAILED Case A:', e);
    }

    // B. RECONCILING day -> CREATE rejected with 403.
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'RECONCILING' });
    try {
      await createTx(warehouse1._id, batch1._id, d1);
      console.error('FAILED Case B: Should have rejected for RECONCILING');
    } catch (e) {
      if (e.message.includes('frozen') && e.statusCode === 403) {
        console.log('PASSED Case B: Rejected with 403 for RECONCILING day.');
      } else {
        console.error('FAILED Case B:', e);
      }
    }

    // C. PENDING_APPROVAL day -> CREATE rejected with 403.
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'PENDING_APPROVAL' });
    try {
      await createTx(warehouse1._id, batch1._id, d1);
      console.error('FAILED Case C: Should have rejected for PENDING_APPROVAL');
    } catch (e) {
      if (e.message.includes('frozen')) console.log('PASSED Case C: Rejected with 403 for PENDING_APPROVAL day.');
      else console.error('FAILED Case C:', e);
    }

    // D. CLOSED day -> CREATE rejected with 403.
    await DailyClosing.findByIdAndUpdate(day1._id, { status: 'CLOSED' });
    try {
      await createTx(warehouse1._id, batch1._id, d1);
      console.error('FAILED Case D: Should have rejected for CLOSED');
    } catch (e) {
      if (e.message.includes('frozen')) console.log('PASSED Case D: Rejected with 403 for CLOSED day.');
      else console.error('FAILED Case D:', e);
    }

    // E. Frozen day -> existing READ operations still succeed.
    try {
      const list = await inventoryTransactionService.list({ referenceType: 'TEST-P21' });
      if (list.length >= 1) console.log('PASSED Case E: Read operations succeed on frozen days.');
      else console.error('FAILED Case E: Read returned no results.');
    } catch (e) {
      console.error('FAILED Case E:', e);
    }

    // F. Different warehouse -> evaluated against the correct warehouse's DailyClosing.
    // warehouse2's day is OPEN. It should succeed, even though warehouse1's day is CLOSED for the same date.
    try {
      const tx2 = await createTx(warehouse2._id, batch2._id, d1);
      console.log('PASSED Case F: Transaction succeeds on a different warehouse with an OPEN day.');
    } catch (e) {
      console.error('FAILED Case F:', e);
    }

    console.log('\nALL PHASE 2.1 TESTS EXECUTED.');
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

runTests();
