// Script to seed comprehensive test data for all modules
// Run with: node src/seedMockData.js
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./config/env');

const Category = require('./models/category.model');
const Unit = require('./models/unit.model');
const Supplier = require('./models/supplier.model');
const Warehouse = require('./models/warehouse.model');
const Product = require('./models/product.model');
const Batch = require('./models/batch.model');
const CurrentStock = require('./models/currentStock.model');
const Recipe = require('./models/recipe.model');
const Menu = require('./models/menu.model');
const MealRequest = require('./models/mealRequest.model');
const User = require('./models/user.model');

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('[seedMockData] Connected to MongoDB');

  // Find users for auditing
  const adminUser = await User.findOne({ username: 'admin' });
  const messUser = await User.findOne({ username: 'mess.officer' });
  const performedBy = adminUser ? adminUser._id : new mongoose.Types.ObjectId();
  const messOfficerId = messUser ? messUser._id : performedBy;

  // Clear existing mock collections (except auth roles/users)
  console.log('[seedMockData] Cleaning existing operational data...');
  await Batch.deleteMany({});
  await CurrentStock.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Unit.deleteMany({});
  await Supplier.deleteMany({});
  await Warehouse.deleteMany({});
  await Recipe.deleteMany({});
  await Menu.deleteMany({});
  await MealRequest.deleteMany({});
  
  // Clean transactions and reservations to prevent stale references
  try {
    await mongoose.connection.collection('inventorytransactions').deleteMany({});
    await mongoose.connection.collection('reservations').deleteMany({});
    await mongoose.connection.collection('mealdistributions').deleteMany({});
  } catch (e) {
    console.log('[seedMockData] No transactions/reservations collections found yet to clear.');
  }

  // 1. Seed Units
  console.log('[seedMockData] Seeding Units...');
  const units = await Unit.insertMany([
    { name: 'كيلوجرام', abbreviation: 'kg', category: 'weight', description: 'كيلوجرام قياسي' },
    { name: 'لتر', abbreviation: 'l', category: 'volume', description: 'لتر سوائل قياسي' },
    { name: 'علبة', abbreviation: 'box', category: 'quantity', description: 'علبة معلبات كرتون/صفيح' },
    { name: 'حبة', abbreviation: 'pcs', category: 'quantity', description: 'حبة مفردة' },
  ]);
  const uKg = units[0];
  const uL = units[1];
  const uBox = units[2];
  const uPcs = units[3];

  // 2. Seed Categories
  console.log('[seedMockData] Seeding Categories...');
  const categories = await Category.insertMany([
    { name: 'لحوم ودواجن', description: 'اللحوم الطازجة والمجمدة بأنواعها', isActive: true },
    { name: 'خضروات وفواكه', description: 'خضروات وفواكه طازجة يومية', isActive: true },
    { name: 'معلبات ومواد جافة', description: 'أرز، معلبات، مواد تخزين مبردة أو جافة', isActive: true },
    { name: 'ألبان ومشتقاتها', description: 'حليب، أجبان، زبادي وغيرها', isActive: true },
  ]);
  const cMeat = categories[0];
  const cVeg = categories[1];
  const cDry = categories[2];
  const cDairy = categories[3];

  // 3. Seed Suppliers
  console.log('[seedMockData] Seeding Suppliers...');
  const suppliers = await Supplier.insertMany([
    { name: 'الشركة الوطنية للإمداد الغذائي', contactName: 'أحمد الحربي', email: 'ahmed@nationalfood.sa', phone: '0501234567', address: 'الرياض، المملكة العربية السعودية' },
    { name: 'مزارع طيبة الزراعية', contactName: 'خالد الطيبي', email: 'khaled@taibafarms.sa', phone: '0507654321', address: 'المدينة المنورة، المملكة العربية السعودية' },
  ]);
  const sNational = suppliers[0];
  const sTaiba = suppliers[1];

  // 4. Seed Warehouses
  console.log('[seedMockData] Seeding Warehouses...');
  const warehouses = await Warehouse.insertMany([
    { name: 'المستودع الجاف الرئيسي (أ)', code: 'WH-DRY-A', location: 'المبنى الجنوبي، بوابة 2', type: 'dry', isActive: true },
    { name: 'مستودع التبريد والتجميد (ب)', code: 'WH-COLD-B', location: 'المبنى الشرقي، بوابة 4', type: 'cold', isActive: true },
  ]);
  const whDry = warehouses[0];
  const whCold = warehouses[1];

  // 5. Seed Products
  console.log('[seedMockData] Seeding Products...');
  const products = await Product.insertMany([
    { name: 'أرز بسمتي فاخر', description: 'أرز حب طويل درجة أولى', category: cDry._id, unit: uKg._id, unitPrice: 8, taxRate: 15, supplier: sNational._id, minStockLevel: 200, maxStockLevel: 2000, sku: 'PROD-RICE-001', barcode: '6281100223311', isActive: true },
    { name: 'لحم بقري مجمد مفروم', description: 'لحم بقري هندي عالي الجودة للطهي', category: cMeat._id, unit: uKg._id, unitPrice: 28, taxRate: 15, supplier: sNational._id, minStockLevel: 100, maxStockLevel: 1000, sku: 'PROD-BEEF-002', barcode: '6281100223322', isActive: true },
    { name: 'بصل طازج', description: 'بصل أحمر محلي', category: cVeg._id, unit: uKg._id, unitPrice: 3.5, taxRate: 0, supplier: sTaiba._id, minStockLevel: 150, maxStockLevel: 800, sku: 'PROD-ONION-003', barcode: '6281100223333', isActive: true },
    { name: 'معجون طماطم صفيح', description: 'عبوة معجون طماطم 400 جرام', category: cDry._id, unit: uBox._id, unitPrice: 2.2, taxRate: 15, supplier: sNational._id, minStockLevel: 50, maxStockLevel: 500, sku: 'PROD-TOMATO-004', barcode: '6281100223344', isActive: true },
    { name: 'حليب طازج كامل الدسم', description: 'حليب عبوات 1 لتر قصيرة الأجل', category: cDairy._id, unit: uL._id, unitPrice: 6, taxRate: 15, supplier: sNational._id, minStockLevel: 50, maxStockLevel: 300, sku: 'PROD-MILK-005', barcode: '6281100223355', isActive: true },
  ]);
  const pRice = products[0];
  const pBeef = products[1];
  const pOnion = products[2];
  const pTomato = products[3];
  const pMilk = products[4];

  // 6. Seed Batches
  console.log('[seedMockData] Seeding Batches...');
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  const batches = await Batch.insertMany([
    { product: pRice._id, warehouse: whDry._id, batchNumber: 'B-RICE-2026-001', lotNumber: 'L-RICE-01', manufacturingDate: today, expiryDate: nextYear, initialQuantity: 1000, availableQuantity: 1000, reservedQuantity: 0, unitCost: 6.5, supplier: sNational._id, status: 'active', notes: 'دفعة أرز ممتازة خالية من العيوب' },
    { product: pBeef._id, warehouse: whCold._id, batchNumber: 'B-BEEF-2026-002', lotNumber: 'L-BEEF-02', manufacturingDate: today, expiryDate: nextMonth, initialQuantity: 500, availableQuantity: 500, reservedQuantity: 0, unitCost: 24, supplier: sNational._id, status: 'active', notes: 'لحم بقري مجمد مفروم، يحفظ مجمد تحت -18 درجة' },
    { product: pOnion._id, warehouse: whDry._id, batchNumber: 'B-ONION-2026-003', lotNumber: 'L-ONION-03', manufacturingDate: today, expiryDate: nextMonth, initialQuantity: 300, availableQuantity: 300, reservedQuantity: 0, unitCost: 2.8, supplier: sTaiba._id, status: 'active', notes: 'خضروات طازجة يومية سريعة التلف' },
    { product: pTomato._id, warehouse: whDry._id, batchNumber: 'B-TOM-2026-004', lotNumber: 'L-TOM-04', manufacturingDate: today, expiryDate: nextYear, initialQuantity: 400, availableQuantity: 400, reservedQuantity: 0, unitCost: 1.8, supplier: sNational._id, status: 'active', notes: 'معجون طماطم صالح للاستخدام حتى نهاية العام' },
  ]);

  // 7. Seed CurrentStock
  console.log('[seedMockData] Syncing CurrentStock...');
  for (const b of batches) {
    await CurrentStock.findOneAndUpdate(
      { product: b.product, warehouse: b.warehouse },
      {
        $inc: {
          batchCount: 1,
          totalQuantity: b.availableQuantity,
          availableQuantity: b.availableQuantity,
        },
        $set: {
          weightedAverageCost: b.unitCost,
          lastTransactionDate: new Date(),
          lastExpiryDate: b.expiryDate,
        },
      },
      { upsert: true }
    );
  }

  // 8. Seed Recipes
  console.log('[seedMockData] Seeding Recipes...');
  const recipes = await Recipe.insertMany([
    {
      name: 'كابسة لحم بالبصل والأرز',
      recipeNumber: 'REC-KABSA-001',
      category: cMeat._id,
      yield: 100, // 100 servings
      items: [
        { product: pRice._id, quantity: 10, unit: uKg._id }, // 10kg rice
        { product: pBeef._id, quantity: 12, unit: uKg._id }, // 12kg beef
        { product: pOnion._id, quantity: 3, unit: uKg._id },  // 3kg onion
        { product: pTomato._id, quantity: 4, unit: uBox._id }, // 4 boxes tomato paste
      ],
      instructions: '1. يُقلى البصل في قدر كبير حتى يذبل.\n2. يُضاف اللحم والبهارات ويُقلب جيداً.\n3. يُضاف معجون الطماطم والماء ويُترك اللحم لينضج.\n4. يُضاف الأرز ويُغطى القدر حتى ينضج الأرز تماماً.',
      notes: 'كابسة اللحم الرئيسية لوجبة الغداء للكتائب العسكرية',
      status: 'active',
      createdBy: messOfficerId,
    },
    {
      name: 'شوربة بصل باللحم المفروم',
      recipeNumber: 'REC-SOUP-002',
      category: cMeat._id,
      yield: 50, // 50 servings
      items: [
        { product: pBeef._id, quantity: 5, unit: uKg._id },
        { product: pOnion._id, quantity: 4, unit: uKg._id },
        { product: pTomato._id, quantity: 2, unit: uBox._id },
      ],
      instructions: '1. يُحمّر البصل ثم اللحم.\n2. يُضاف المرق ومعجون الطماطم ويُغلى الخليط على نار هادئة.',
      notes: 'شوربة جانبية تدعم قائمة الغداء والعشاء',
      status: 'active',
      createdBy: messOfficerId,
    },
  ]);
  const rKabsa = recipes[0];

  // 9. Seed Menus
  console.log('[seedMockData] Seeding Menus...');
  const menuDateStr = today.toISOString().split('T')[0];
  const menus = await Menu.insertMany([
    {
      menuNumber: 'MENU-2026-001',
      menuDate: today,
      mealType: 'lunch',
      status: 'published', // set to published so it can be requested
      items: [
        { recipe: rKabsa._id, plannedServings: 200, notes: 'طبق الكابسة الرئيسي' },
      ],
      notes: 'وجبة الغداء المقررة لليوم',
      createdBy: messOfficerId,
    },
  ]);
  const menuLunch = menus[0];

  // 10. Seed Meal Request (pending approval to test flow)
  console.log('[seedMockData] Seeding Meal Requests...');
  const requests = await MealRequest.insertMany([
    {
      requestNumber: 'REQ-2026-001',
      requestingUnit: 'الكتيبة الأولى - مدرعات',
      menu: menuLunch._id,
      items: [
        { recipe: rKabsa._id, requestedServings: 150 },
      ],
      notes: 'طلب غداء طارئ لدعم مناورات الكتيبة الأولى اليوم',
      status: 'submitted',
      requestedBy: messOfficerId,
      requestDate: today,
    },
  ]);

  console.log('[seedMockData] Successfully seeded all test operational data!');
  console.log(`- Units: ${units.length}`);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Suppliers: ${suppliers.length}`);
  console.log(`- Warehouses: ${warehouses.length}`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Batches: ${batches.length}`);
  console.log(`- Recipes: ${recipes.length}`);
  console.log(`- Menus: ${menus.length}`);
  console.log(`- Meal Requests: ${requests.length}`);
  console.log('\nYou can now login as "mess.officer" (password: Mess@12345) and fully test the meal management workflows.');

  await mongoose.disconnect();
  console.log('[seedMockData] Connected disconnected');
}

seed().catch((err) => {
  console.error('[seedMockData] Failed to seed mock data:', err);
  process.exit(1);
});
