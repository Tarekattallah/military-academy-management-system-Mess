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
const Reservation = require('./models/reservation.model');
const MealDistribution = require('./models/mealDistribution.model');
const Receiving = require('./models/receiving.model');
const Transfer = require('./models/transfer.model');
const Return = require('./models/return.model');
const Waste = require('./models/waste.model');
const StockCount = require('./models/stockCount.model');
const InventoryTransaction = require('./models/inventoryTransaction.model');
const User = require('./models/user.model');

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('[seedMockData] Connected to MongoDB');

  const adminUser = await User.findOne({ username: 'admin' });
  const storeUser = await User.findOne({ username: 'store.keeper' });
  const messUser = await User.findOne({ username: 'mess.officer' });
  const performedBy = adminUser ? adminUser._id : new mongoose.Types.ObjectId();
  const storeKeeperId = storeUser ? storeUser._id : performedBy;
  const messOfficerId = messUser ? messUser._id : performedBy;

  // Clear existing operational data
  console.log('[seedMockData] Cleaning existing operational data...');
  await Receiving.deleteMany({});
  await Transfer.deleteMany({});
  await Return.deleteMany({});
  await Waste.deleteMany({});
  await StockCount.deleteMany({});
  await MealDistribution.deleteMany({});
  await Reservation.deleteMany({});
  await MealRequest.deleteMany({});
  await Menu.deleteMany({});
  await Recipe.deleteMany({});
  await Batch.deleteMany({});
  await CurrentStock.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Unit.deleteMany({});
  await Supplier.deleteMany({});
  await Warehouse.deleteMany({});
  try {
    await mongoose.connection.collection('inventorytransactions').deleteMany({});
  } catch (e) {
    console.log('[seedMockData] No inventorytransactions collection found yet to clear.');
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  // 1. Seed Units
  console.log('[seedMockData] Seeding Units...');
  const units = await Unit.insertMany([
    { name: 'كيلوجرام', abbreviation: 'kg', category: 'weight', description: 'كيلوجرام قياسي', isActive: true },
    { name: 'لتر', abbreviation: 'l', category: 'volume', description: 'لتر سوائل قياسي', isActive: true },
    { name: 'علبة', abbreviation: 'box', category: 'quantity', description: 'علبة معلبات كرتون/صفيح', isActive: true },
    { name: 'حبة', abbreviation: 'pcs', category: 'quantity', description: 'حبة مفردة', isActive: true },
    { name: 'متر', abbreviation: 'm', category: 'length', description: 'متر قياس طولي', isActive: true },
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
    { name: 'مشروبات', description: 'مشروبات ساخنة وباردة', isActive: true },
  ]);
  const cMeat = categories[0];
  const cVeg = categories[1];
  const cDry = categories[2];
  const cDairy = categories[3];
  const cDrinks = categories[4];

  // 3. Seed Suppliers
  console.log('[seedMockData] Seeding Suppliers...');
  const suppliers = await Supplier.insertMany([
    { name: 'الشركة الوطنية للإمداد الغذائي', contactName: 'أحمد الحربي', email: 'ahmed@nationalfood.sa', phone: '0501234567', address: 'الرياض، المملكة العربية السعودية', isActive: true },
    { name: 'مزارع طيبة الزراعية', contactName: 'خالد الطيبي', email: 'khaled@taibafarms.sa', phone: '0507654321', address: 'المدينة المنورة، المملكة العربية السعودية', isActive: true },
    { name: 'مصنع الألبان الوطنية', contactName: 'سعيد الغامدي', email: 'said@dairy.sa', phone: '0559876543', address: 'جدة، المملكة العربية السعودية', isActive: true },
    { name: 'شركة المشروبات العالمية', contactName: 'محمد العتيبي', email: 'mohammad@beverages.sa', phone: '0541112233', address: 'الدمام، المملكة العربية السعودية', isActive: true },
  ]);
  const sNational = suppliers[0];
  const sTaiba = suppliers[1];
  const sDairy = suppliers[2];
  const sBeverages = suppliers[3];

  // 4. Seed Warehouses
  console.log('[seedMockData] Seeding Warehouses...');
  const warehouses = await Warehouse.insertMany([
    { name: 'المستودع الجاف الرئيسي (أ)', code: 'WH-DRY-A', location: 'المبنى الجنوبي، بوابة 2', type: 'dry', isActive: true },
    { name: 'مستودع التبريد والتجميد (ب)', code: 'WH-COLD-B', location: 'المبنى الشرقي، بوابة 4', type: 'cold', isActive: true },
    { name: 'مستودع المشروعات والمعلبات (ج)', code: 'WH-BEVERAGES-C', location: 'المبنى الغربي، بوابة 6', type: 'dry', isActive: true },
  ]);
  const whDry = warehouses[0];
  const whCold = warehouses[1];
  const whBeverages = warehouses[2];

  // 5. Seed Products
  console.log('[seedMockData] Seeding Products...');
  const products = await Product.insertMany([
    { name: 'أرز بسمتي فاخر', description: 'أرز حب طويل درجة أولى', category: cDry._id, unit: uKg._id, unitPrice: 8, taxRate: 15, supplier: sNational._id, minStockLevel: 200, maxStockLevel: 2000, sku: 'PROD-RICE-001', barcode: '6281100223311', isActive: true },
    { name: 'لحم بقري مجمد مفروم', description: 'لحم بقري هندي عالي الجودة للطهي', category: cMeat._id, unit: uKg._id, unitPrice: 28, taxRate: 15, supplier: sNational._id, minStockLevel: 100, maxStockLevel: 1000, sku: 'PROD-BEEF-002', barcode: '6281100223322', isActive: true },
    { name: 'بصل طازج', description: 'بصل أحمر محلي', category: cVeg._id, unit: uKg._id, unitPrice: 3.5, taxRate: 0, supplier: sTaiba._id, minStockLevel: 150, maxStockLevel: 800, sku: 'PROD-ONION-003', barcode: '6281100223333', isActive: true },
    { name: 'معجون طماطم صفيح', description: 'عبوة معجون طماطم 400 جرام', category: cDry._id, unit: uBox._id, unitPrice: 2.2, taxRate: 15, supplier: sNational._id, minStockLevel: 50, maxStockLevel: 500, sku: 'PROD-TOMATO-004', barcode: '6281100223344', isActive: true },
    { name: 'حليب طازج كامل الدسم', description: 'حليب عبوات 1 لتر قصيرة الأجل', category: cDairy._id, unit: uL._id, unitPrice: 6, taxRate: 15, supplier: sDairy._id, minStockLevel: 50, maxStockLevel: 300, sku: 'PROD-MILK-005', barcode: '6281100223355', isActive: true },
    { name: 'دجاج مجمد كامل', description: 'دجاج كامل مجمد وزن 1.2-1.5 كجم', category: cMeat._id, unit: uPcs._id, unitPrice: 18, taxRate: 15, supplier: sNational._id, minStockLevel: 80, maxStockLevel: 500, sku: 'PROD-CHICKEN-006', barcode: '6281100223366', isActive: true },
    { name: 'طماطم طازجة', description: 'طماطم طازجة للسلطة والطهي', category: cVeg._id, unit: uKg._id, unitPrice: 4, taxRate: 0, supplier: sTaiba._id, minStockLevel: 100, maxStockLevel: 600, sku: 'PROD-TOMATO-007', barcode: '6281100223377', isActive: true },
    { name: 'ماء شرب معبأ', description: 'عبوات مياه 1.5 لتر', category: cDrinks._id, unit: uPcs._id, unitPrice: 1, taxRate: 15, supplier: sBeverages._id, minStockLevel: 200, maxStockLevel: 2000, sku: 'PROD-WATER-008', barcode: '6281100223388', isActive: true },
    { name: 'أرز بسمتي 10 كجم', description: 'أرز بسمتي فاخر عبوة كبيرة', category: cDry._id, unit: uPcs._id, unitPrice: 35, taxRate: 15, supplier: sNational._id, minStockLevel: 50, maxStockLevel: 400, sku: 'PROD-RICE-BAG-009', barcode: '6281100223399', isActive: true },
    { name: 'زبادي طازج', description: 'زبادي كامل الدسم عبوات 500 جرام', category: cDairy._id, unit: uPcs._id, unitPrice: 3, taxRate: 15, supplier: sDairy._id, minStockLevel: 80, maxStockLevel: 500, sku: 'PROD-YOGURT-010', barcode: '6281100223400', isActive: true },
  ]);
  const pRice = products[0];
  const pBeef = products[1];
  const pOnion = products[2];
  const pTomatoPaste = products[3];
  const pMilk = products[4];
  const pChicken = products[5];
  const pFreshTomato = products[6];
  const pWater = products[7];
  const pRiceBag = products[8];
  const pYogurt = products[9];

  // 6. Seed Batches
  console.log('[seedMockData] Seeding Batches...');
  const batches = await Batch.insertMany([
    { product: pRice._id, warehouse: whDry._id, batchNumber: 'B-RICE-2026-001', lotNumber: 'L-RICE-01', manufacturingDate: lastWeek, expiryDate: nextYear, initialQuantity: 1000, availableQuantity: 850, reservedQuantity: 50, unitCost: 6.5, supplier: sNational._id, status: 'active', notes: 'دفعة أرز ممتازة خالية من العيوب' },
    { product: pBeef._id, warehouse: whCold._id, batchNumber: 'B-BEEF-2026-002', lotNumber: 'L-BEEF-02', manufacturingDate: yesterday, expiryDate: nextMonth, initialQuantity: 500, availableQuantity: 320, reservedQuantity: 30, unitCost: 24, supplier: sNational._id, status: 'active', notes: 'لحم بقري مجمد مفروم، يحفظ مجمد تحت -18 درجة' },
    { product: pOnion._id, warehouse: whDry._id, batchNumber: 'B-ONION-2026-003', lotNumber: 'L-ONION-03', manufacturingDate: yesterday, expiryDate: nextMonth, initialQuantity: 300, availableQuantity: 180, reservedQuantity: 0, unitCost: 2.8, supplier: sTaiba._id, status: 'active', notes: 'خضروات طازجة يومية سريعة التلف' },
    { product: pTomatoPaste._id, warehouse: whDry._id, batchNumber: 'B-TOM-2026-004', lotNumber: 'L-TOM-04', manufacturingDate: lastWeek, expiryDate: nextYear, initialQuantity: 400, availableQuantity: 360, reservedQuantity: 10, unitCost: 1.8, supplier: sNational._id, status: 'active', notes: 'معجون طماطم صالح للاستخدام حتى نهاية العام' },
    { product: pMilk._id, warehouse: whCold._id, batchNumber: 'B-MILK-2026-005', lotNumber: 'L-MILK-05', manufacturingDate: today, expiryDate: nextMonth, initialQuantity: 200, availableQuantity: 150, reservedQuantity: 20, unitCost: 4.5, supplier: sDairy._id, status: 'active', notes: 'حليب طازج قصير الأجل' },
    { product: pChicken._id, warehouse: whCold._id, batchNumber: 'B-CHICKEN-2026-006', lotNumber: 'L-CHICKEN-06', manufacturingDate: yesterday, expiryDate: nextMonth, initialQuantity: 300, availableQuantity: 210, reservedQuantity: 15, unitCost: 13, supplier: sNational._id, status: 'active', notes: 'دجاج كامل مجمد' },
    { product: pWater._id, warehouse: whBeverages._id, batchNumber: 'B-WATER-2026-007', lotNumber: 'L-WATER-07', manufacturingDate: lastWeek, expiryDate: nextYear, initialQuantity: 1000, availableQuantity: 900, reservedQuantity: 50, unitCost: 0.7, supplier: sBeverages._id, status: 'active', notes: 'مياه شرب معبأة' },
    { product: pYogurt._id, warehouse: whCold._id, batchNumber: 'B-YOGURT-2026-008', lotNumber: 'L-YOGURT-08', manufacturingDate: today, expiryDate: nextMonth, initialQuantity: 150, availableQuantity: 100, reservedQuantity: 10, unitCost: 2.2, supplier: sDairy._id, status: 'active', notes: 'زبادي طازج' },
  ]);
  const bRice = batches[0];
  const bBeef = batches[1];
  const bOnion = batches[2];
  const bTomatoPaste = batches[3];
  const bMilk = batches[4];
  const bChicken = batches[5];
  const bWater = batches[6];
  const bYogurt = batches[7];

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
          lastTransactionDate: today,
          lastExpiryDate: b.expiryDate,
        },
      },
      { upsert: true }
    );
  }

  // 8. Seed Receiving
  console.log('[seedMockData] Seeding Receiving...');
  const receivings = await Receiving.insertMany([
    {
      receivingNumber: 'REC-2026-001',
      supplier: sNational._id,
      warehouse: whDry._id,
      receivingDate: yesterday,
      status: 'completed',
      notes: 'استلام أولي لأرز ولحم',
      createdBy: storeKeeperId,
      items: [
        { product: pRice._id, batchNumber: 'B-RICE-2026-001', quantity: 500, unitCost: 6.5, manufacturingDate: lastWeek, expiryDate: nextYear },
        { product: pBeef._id, batchNumber: 'B-BEEF-2026-002', quantity: 200, unitCost: 24, manufacturingDate: yesterday, expiryDate: nextMonth },
      ],
    },
    {
      receivingNumber: 'REC-2026-002',
      supplier: sTaiba._id,
      warehouse: whDry._id,
      receivingDate: today,
      status: 'completed',
      notes: 'استلام خضروات يومية',
      createdBy: storeKeeperId,
      items: [
        { product: pOnion._id, batchNumber: 'B-ONION-2026-003', quantity: 200, unitCost: 2.8, manufacturingDate: yesterday, expiryDate: nextMonth },
        { product: pFreshTomato._id, batchNumber: 'B-FRESH-TOM-009', quantity: 150, unitCost: 3.5, manufacturingDate: today, expiryDate: nextMonth },
      ],
    },
    {
      receivingNumber: 'REC-2026-003',
      supplier: sDairy._id,
      warehouse: whCold._id,
      receivingDate: today,
      status: 'draft',
      notes: 'استلام منتجات ألبان',
      createdBy: storeKeeperId,
      items: [
        { product: pMilk._id, batchNumber: 'B-MILK-2026-005', quantity: 100, unitCost: 4.5, manufacturingDate: today, expiryDate: nextMonth },
        { product: pYogurt._id, batchNumber: 'B-YOGURT-2026-008', quantity: 80, unitCost: 2.2, manufacturingDate: today, expiryDate: nextMonth },
      ],
    },
  ]);

  // 9. Seed Transfers
  console.log('[seedMockData] Seeding Transfers...');
  const transfers = await Transfer.insertMany([
    {
      transferNumber: 'TRF-2026-001',
      sourceWarehouse: whDry._id,
      destinationWarehouse: whCold._id,
      transferDate: yesterday,
      status: 'completed',
      notes: 'تحويل لحوم مجمدة للمستودع البارد',
      createdBy: storeKeeperId,
      items: [
        { product: pBeef._id, sourceBatch: bBeef._id, destinationBatchNumber: 'B-BEEF-TRF-001', quantity: 50, unitCost: 24 },
      ],
    },
    {
      transferNumber: 'TRF-2026-002',
      sourceWarehouse: whBeverages._id,
      destinationWarehouse: whDry._id,
      transferDate: today,
      status: 'draft',
      notes: 'تحويل مياه للمستودع الجاف للطوارئ',
      createdBy: storeKeeperId,
      items: [
        { product: pWater._id, sourceBatch: bWater._id, destinationBatchNumber: 'B-WATER-TRF-002', quantity: 100, unitCost: 0.7 },
      ],
    },
  ]);

  // 10. Seed Returns
  console.log('[seedMockData] Seeding Returns...');
  const returns = await Return.insertMany([
    {
      returnNumber: 'RET-2026-001',
      returnType: 'return_to_supplier',
      warehouse: whDry._id,
      supplier: sNational._id,
      returnDate: yesterday,
      status: 'completed',
      reason: 'تلف في العبوة',
      notes: 'مرتجعات أرز تالف',
      createdBy: storeKeeperId,
      items: [
        { product: pRice._id, batch: bRice._id, quantity: 20 },
      ],
    },
    {
      returnNumber: 'RET-2026-002',
      returnType: 'internal_return',
      warehouse: whCold._id,
      returnDate: today,
      status: 'draft',
      reason: 'منتج خطأ',
      notes: 'مرتجعات داخلية',
      createdBy: storeKeeperId,
      items: [
        { product: pMilk._id, batch: bMilk._id, quantity: 10 },
      ],
    },
  ]);

  // 11. Seed Waste
  console.log('[seedMockData] Seeding Waste...');
  const wastes = await Waste.insertMany([
    {
      wasteNumber: 'WASTE-2026-001',
      warehouse: whDry._id,
      wasteDate: yesterday,
      status: 'completed',
      reason: 'انتهاء صلاحية',
      notes: 'هالك بصل فاسد',
      createdBy: storeKeeperId,
      items: [
        { product: pOnion._id, batch: bOnion._id, quantity: 15 },
      ],
    },
    {
      wasteNumber: 'WASTE-2026-002',
      warehouse: whCold._id,
      wasteDate: today,
      status: 'draft',
      reason: 'تلف أثناء النقل',
      notes: 'هالك حليب متسرب',
      createdBy: storeKeeperId,
      items: [
        { product: pMilk._id, batch: bMilk._id, quantity: 5 },
      ],
    },
  ]);

  // 12. Seed Stock Counts
  console.log('[seedMockData] Seeding Stock Counts...');
  const stockCounts = await StockCount.insertMany([
    {
      countNumber: 'SC-2026-001',
      warehouse: whDry._id,
      countDate: yesterday,
      status: 'approved',
      notes: 'جرد ربع سنوي',
      createdBy: storeKeeperId,
      approvedBy: adminUser ? adminUser._id : performedBy,
      approvedAt: today,
      items: [
        { product: pRice._id, batch: bRice._id, systemQuantity: 900, physicalQuantity: 900, difference: 0 },
        { product: pOnion._id, batch: bOnion._id, systemQuantity: 200, physicalQuantity: 195, difference: -5 },
      ],
    },
    {
      countNumber: 'SC-2026-002',
      warehouse: whCold._id,
      countDate: today,
      status: 'in_progress',
      notes: 'جرد شهري',
      createdBy: storeKeeperId,
      items: [
        { product: pBeef._id, batch: bBeef._id, systemQuantity: 350, physicalQuantity: 340, difference: -10 },
        { product: pMilk._id, batch: bMilk._id, systemQuantity: 160, physicalQuantity: 155, difference: -5 },
      ],
    },
  ]);

  // 13. Seed Inventory Transactions
  console.log('[seedMockData] Seeding Inventory Transactions...');
  const inventoryTransactions = [];
  const transactionTypes = ['receiving', 'transfer_out', 'transfer_in', 'waste', 'adjustment', 'return'];
  const productsList = [pRice, pBeef, pOnion, pTomatoPaste, pMilk, pChicken, pWater, pYogurt];
  for (let i = 0; i < 250; i++) {
    const product = productsList[i % productsList.length];
    const type = transactionTypes[i % transactionTypes.length];
    const warehouse = i % 2 === 0 ? whDry._id : whCold._id;
    const quantity = Math.floor(Math.random() * 50) + 5;
    
    // Distribute dates over the last 30 days
    const txDate = new Date(today);
    txDate.setDate(txDate.getDate() - Math.floor(Math.random() * 30));

    inventoryTransactions.push({
      transactionNumber: `INV-2026-${String(i + 1).padStart(3, '0')}`,
      type,
      product: product._id,
      warehouse,
      quantity: type === 'waste' ? -quantity : quantity,
      batch: batches[i % batches.length]._id,
      referenceType: type === 'receiving' ? 'Receiving' : type === 'waste' ? 'Waste' : type === 'transfer_out' || type === 'transfer_in' ? 'Transfer' : 'StockCount',
      referenceId: new mongoose.Types.ObjectId(),
      notes: `عملية مخزون ${type} تلقائية للتجربة رقم ${i+1}`,
      createdBy: storeKeeperId,
      transactionDate: txDate,
    });
  }
  await mongoose.connection.collection('inventorytransactions').insertMany(inventoryTransactions);

  // 14. Seed Recipes
  console.log('[seedMockData] Seeding Recipes...');
  const recipes = await Recipe.insertMany([
    {
      name: 'كابسة لحم بالبصل والأرز',
      recipeNumber: 'REC-KABSA-001',
      category: cMeat._id,
      yield: 100,
      items: [
        { product: pRice._id, quantity: 10, unit: uKg._id },
        { product: pBeef._id, quantity: 12, unit: uKg._id },
        { product: pOnion._id, quantity: 3, unit: uKg._id },
        { product: pTomatoPaste._id, quantity: 4, unit: uBox._id },
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
      yield: 50,
      items: [
        { product: pBeef._id, quantity: 5, unit: uKg._id },
        { product: pOnion._id, quantity: 4, unit: uKg._id },
        { product: pTomatoPaste._id, quantity: 2, unit: uBox._id },
      ],
      instructions: '1. يُحمّر البصل ثم اللحم.\n2. يُضاف المرق ومعجون الطماطم ويُغلى الخليط على نار هادئة.',
      notes: 'شوربة جانبية تدعم قائمة الغداء والعشاء',
      status: 'active',
      createdBy: messOfficerId,
    },
    {
      name: 'أرز أبيض عادي',
      recipeNumber: 'REC-RICE-003',
      category: cDry._id,
      yield: 100,
      items: [
        { product: pRice._id, quantity: 8, unit: uKg._id },
      ],
      instructions: '1. يُغسل الأرز جيداً.\n2. يُضاف الماء المغذي ويُترك لينضج.',
      notes: 'أرز أبيض أساسي لكل الوجبات',
      status: 'active',
      createdBy: messOfficerId,
    },
  ]);
  const rKabsa = recipes[0];

  // 15. Seed Menus
  console.log('[seedMockData] Seeding Menus...');
  const menus = await Menu.insertMany([
    {
      menuNumber: 'MENU-2026-001',
      menuDate: today,
      mealType: 'lunch',
      status: 'published',
      items: [
        { recipe: rKabsa._id, plannedServings: 200, notes: 'طبق الكابسة الرئيسي' },
      ],
      notes: 'وجبة الغداء المقررة لليوم',
      createdBy: messOfficerId,
    },
    {
      menuNumber: 'MENU-2026-002',
      menuDate: lastWeek,
      mealType: 'dinner',
      status: 'published',
      items: [
        { recipe: recipes[2]._id, plannedServings: 180, notes: 'أرز عادي مع مرق دجاج' },
      ],
      notes: 'وجبة عشاء الأسبوع الماضي',
      createdBy: messOfficerId,
    },
  ]);
  const menuLunch = menus[0];

  // 16. Seed Meal Requests
  console.log('[seedMockData] Seeding Meal Requests...');
  const mealRequests = await MealRequest.insertMany([
    {
      requestNumber: 'REQ-2026-001',
      requestingUnit: 'الكتيبة الأولى - مدرعات',
      menu: menuLunch._id,
      items: [
        { recipe: rKabsa._id, requestedServings: 150 },
      ],
      notes: 'طلب غداء طارئ لدعم مناورات الكتيبة الأولى اليوم',
      status: 'approved',
      requestedBy: messOfficerId,
      requestDate: today,
      approvedBy: adminUser ? adminUser._id : performedBy,
      approvedAt: today,
    },
    {
      requestNumber: 'REQ-2026-002',
      requestingUnit: 'الكتيبة الثانية - مشاة',
      menu: menuLunch._id,
      items: [
        { recipe: rKabsa._id, requestedServings: 100 },
      ],
      notes: 'طلب غداء عادي',
      status: 'submitted',
      requestedBy: messOfficerId,
      requestDate: today,
    },
  ]);

  // 17. Seed Reservations
  console.log('[seedMockData] Seeding Reservations...');
  const reservations = await Reservation.insertMany([
    {
      reservationNumber: 'RES-2026-001',
      mealRequest: mealRequests[0]._id,
      warehouse: whDry._id,
      requestingUnit: 'الكتيبة الأولى - مدرعات',
      menu: menuLunch._id,
      status: 'reserved',
      reservedBy: storeKeeperId,
      reservedAt: today,
      notes: 'حجز مبدئي لمواد وجبة الغداء',
      items: [
        { recipe: rKabsa._id, batch: bRice._id, product: pRice._id, reservedQuantity: 15, consumedQuantity: 0 },
        { recipe: rKabsa._id, batch: bBeef._id, product: pBeef._id, reservedQuantity: 18, consumedQuantity: 0 },
        { recipe: rKabsa._id, batch: bOnion._id, product: pOnion._id, reservedQuantity: 4.5, consumedQuantity: 0 },
        { recipe: rKabsa._id, batch: bTomatoPaste._id, product: pTomatoPaste._id, reservedQuantity: 6, consumedQuantity: 0 },
      ],
    },
    {
      reservationNumber: 'RES-2026-002',
      mealRequest: mealRequests[1]._id,
      warehouse: whDry._id,
      requestingUnit: 'الكتيبة الثانية - مشاة',
      menu: menuLunch._id,
      status: 'draft',
      notes: 'حجز قيد الإعداد',
      items: [
        { recipe: rKabsa._id, batch: bRice._id, product: pRice._id, reservedQuantity: 10, consumedQuantity: 0 },
        { recipe: rKabsa._id, batch: bBeef._id, product: pBeef._id, reservedQuantity: 12, consumedQuantity: 0 },
      ],
    },
  ]);

  // 18. Seed Meal Distributions
  console.log('[seedMockData] Seeding Meal Distributions...');
  const mealDistributions = await MealDistribution.insertMany([
    {
      distributionNumber: 'DIST-2026-001',
      reservation: reservations[0]._id,
      mealRequest: mealRequests[0]._id,
      menu: menuLunch._id,
      requestingUnit: 'الكتيبة الأولى - مدرعات',
      distributionDate: today,
      status: 'in_progress',
      distributedBy: storeKeeperId,
      notes: 'توزيع وجبة الغداء للكتيبة الأولى',
      recipeSnapshots: [
        {
          recipe: rKabsa._id,
          recipeName: rKabsa.name,
          recipeNumber: rKabsa.recipeNumber,
          recipeYield: rKabsa.yield,
          ingredients: rKabsa.items.map(item => ({
            product: item.product,
            productName: [pRice, pBeef, pOnion, pTomatoPaste].find(p => p._id.equals(item.product))?.name || 'Unknown',
            quantity: item.quantity,
            unit: item.unit,
            unitName: [uKg, uBox].find(u => u._id.equals(item.unit))?.name || 'Unknown'
          })),
        },
      ],
      items: [
        { recipe: rKabsa._id, product: pRice._id, batch: bRice._id, plannedQuantity: 15, actualQuantity: 14.5, wastageQuantity: 0.5 },
        { recipe: rKabsa._id, product: pBeef._id, batch: bBeef._id, plannedQuantity: 18, actualQuantity: 18, wastageQuantity: 0 },
      ],
    },
    {
      distributionNumber: 'DIST-2026-002',
      reservation: reservations[1]._id,
      mealRequest: mealRequests[1]._id,
      menu: menuLunch._id,
      requestingUnit: 'الكتيبة الثانية - مشاة',
      distributionDate: today,
      status: 'draft',
      distributedBy: storeKeeperId,
      notes: 'توزيع قيد الإعداد',
      recipeSnapshots: [
        {
          recipe: rKabsa._id,
          recipeName: rKabsa.name,
          recipeNumber: rKabsa.recipeNumber,
          recipeYield: rKabsa.yield,
          ingredients: rKabsa.items.map(item => ({
            product: item.product,
            productName: [pRice, pBeef, pOnion, pTomatoPaste].find(p => p._id.equals(item.product))?.name || 'Unknown',
            quantity: item.quantity,
            unit: item.unit,
            unitName: [uKg, uBox].find(u => u._id.equals(item.unit))?.name || 'Unknown'
          })),
        },
      ],
      items: [
        { recipe: rKabsa._id, product: pRice._id, batch: bRice._id, plannedQuantity: 10, actualQuantity: 0, wastageQuantity: 0 },
      ],
    },
  ]);

  // 19. Seed Dashboard view-only data summary
  console.log('[seedMockData] Summary:');
  console.log(`- Units: ${units.length}`);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Suppliers: ${suppliers.length}`);
  console.log(`- Warehouses: ${warehouses.length}`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Batches: ${batches.length}`);
  console.log(`- Receiving: ${receivings.length}`);
  console.log(`- Transfers: ${transfers.length}`);
  console.log(`- Returns: ${returns.length}`);
  console.log(`- Waste: ${wastes.length}`);
  console.log(`- Stock Counts: ${stockCounts.length}`);
  console.log(`- Recipes: ${recipes.length}`);
  console.log(`- Menus: ${menus.length}`);
  console.log(`- Meal Requests: ${mealRequests.length}`);
  console.log(`- Reservations: ${reservations.length}`);
  console.log(`- Meal Distributions: ${mealDistributions.length}`);

  await mongoose.disconnect();
  console.log('[seedMockData] Done');
}

seed().catch((err) => {
  console.error('[seedMockData] Failed to seed mock data:', err);
  process.exit(1);
});
