/* eslint-env jest */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const env = require('../config/env');
const Warehouse = require('../models/warehouse.model');
const Supplier = require('../models/supplier.model');
const Product = require('../models/product.model');
const Unit = require('../models/unit.model');
const PurchaseRequest = require('../models/purchaseRequest.model');
const { signToken } = require('../utils/jwt');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms_test';

let adminToken = '';
let warehouseId = '';
let supplierId = '';
let productA = '';
let productB = '';
let productC = '';
let unitKg = '';
let unitL = '';
let inactiveProduct = '';
let inactiveUnit = '';
let adminId;

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
  await mongoose.connection.db.dropDatabase();
  
  adminId = new mongoose.Types.ObjectId();
  adminToken = `${env.cookieName}=` + signToken({
    sub: adminId.toString(),
    username: 'admin',
    roles: ['Super Administrator'],
    permissions: ['purchase-orders:view', 'purchase-orders:update', 'purchase-orders:approve', 'purchase-orders:create', 'purchase-orders:delete']
  });

  const wh = await Warehouse.create({ name: 'Test WH', code: 'WH1', isActive: true });
  warehouseId = wh._id.toString();
  
  const sup = await Supplier.create({ name: 'Test Supplier', code: 'SUP1', isActive: true });
  supplierId = sup._id.toString();

  const uKg = await Unit.create({ name: 'Kilogram', abbreviation: 'kg', type: 'weight', category: 'weight', isActive: true });
  unitKg = uKg._id.toString();

  const uL = await Unit.create({ name: 'Liter', abbreviation: 'L', type: 'volume', category: 'volume', isActive: true });
  unitL = uL._id.toString();
  
  const iu = await Unit.create({ name: 'InactiveUnit', abbreviation: 'iu', type: 'weight', category: 'weight', isActive: false });
  inactiveUnit = iu._id.toString();

  const catId = new mongoose.Types.ObjectId();
  const pA = await Product.create({ name: 'Product A', category: catId, unit: unitKg, isActive: true });
  productA = pA._id.toString();

  const pB = await Product.create({ name: 'Product B', category: catId, unit: unitKg, isActive: true });
  productB = pB._id.toString();

  const pC = await Product.create({ name: 'Product C', category: catId, unit: unitKg, isActive: true });
  productC = pC._id.toString();

  const ip = await Product.create({ name: 'InactiveProduct', category: catId, unit: unitKg, isActive: false });
  inactiveProduct = ip._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Helper to create PRs
async function createPR(status, deleted = false) {
  const pr = await PurchaseRequest.create({
    requestNumber: `PR-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    warehouse: warehouseId,
    requestedBy: adminId,
    createdBy: adminId,
    status: status,
    items: [
      { product: productA, quantity: 10, unit: unitKg },
      { product: productB, quantity: 5, unit: unitKg }
    ],
    deletedAt: deleted ? new Date() : null
  });
  return pr._id.toString();
}

describe('Phase 1.1-C: Purchase Request -> Purchase Order Integrity', () => {

  describe('PR State Validation', () => {
    it('1. Approved PR -> PO creation succeeds', async () => {
      const prId = await createPR('approved');
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [
          { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 },
          { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }
        ]
      });
      expect(res.statusCode).toBe(201);
    });

    it('2. Draft PR -> rejected', async () => {
      const prId = await createPR('draft');
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [{ product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }]
      });
      expect(res.statusCode).toBe(400);
    });

    it('3. Submitted PR -> rejected', async () => {
      const prId = await createPR('submitted');
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [{ product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }]
      });
      expect(res.statusCode).toBe(400);
    });

    it('4. Rejected PR -> rejected', async () => {
      const prId = await createPR('rejected');
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [{ product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }]
      });
      expect(res.statusCode).toBe(400);
    });

    it('5. Cancelled PR -> rejected', async () => {
      const prId = await createPR('cancelled');
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [{ product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }]
      });
      expect(res.statusCode).toBe(400);
    });

    it('6. Soft-deleted PR -> rejected', async () => {
      const prId = await createPR('approved', true);
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [{ product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }]
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Product Matching Validation', () => {
    let prId;
    beforeAll(async () => { prId = await createPR('approved'); });

    it('7. Product exists in PR -> succeeds', async () => {
      // tested in 1
    });

    it('8. Product does not exist in PR -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [
          { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 },
          { product: productC, quantity: 5, unit: unitKg, unitPrice: 10 }
        ]
      });
      expect(res.statusCode).toBe(400);
    });

    it('9. PO quantity equals PR quantity -> succeeds (implicitly done in 1)', () => {});

    it('10. PO quantity below PR quantity -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [
          { product: productA, quantity: 9, unit: unitKg, unitPrice: 5 },
          { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }
        ]
      });
      expect(res.statusCode).toBe(400);
    });

    it('11. PO quantity exceeds PR quantity -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [
          { product: productA, quantity: 11, unit: unitKg, unitPrice: 5 },
          { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }
        ]
      });
      expect(res.statusCode).toBe(400);
    });

    it('12. Different PR/PO array ordering -> succeeds', async () => {
      const pr2 = await createPR('approved');
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: pr2,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [
          { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 },
          { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }
        ]
      });
      expect(res.statusCode).toBe(201);
    });

    it('13. Duplicate product inside PO -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        supplier: supplierId,
        warehouse: warehouseId,
        items: [
          { product: productA, quantity: 5, unit: unitKg, unitPrice: 10 },
          { product: productA, quantity: 5, unit: unitKg, unitPrice: 5 }
        ]
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Duplicate PO & Multiple PO rules', () => {
    let prId;
    let poId;
    beforeAll(async () => { 
      prId = await createPR('approved'); 
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [
          { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 },
          { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }
        ]
      });
      poId = res.body.data._id;
    });

    it('14. First PO for approved PR -> succeeds', () => {
      expect(poId).toBeDefined();
    });

    it('15. Second active PO for same PR -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prId,
        supplier: supplierId,
        warehouse: warehouseId,
        items: [
          { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 },
          { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 }
        ]
      });
      expect(res.statusCode).toBe(400);
    });

    it('16. Soft-deleted previous PO -> replacement PO succeeds', async () => {
      const pr2 = await createPR('approved');
      const r1 = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: pr2, supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 } ]
      });
      await request(app).delete(`/api/v1/purchase-orders/${r1.body.data._id}`).set('Cookie', adminToken);

      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: pr2, supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 } ]
      });
      expect(res.statusCode).toBe(201);
    });

    it('17. Cancelled/rejected previous PO -> replacement behavior follows active-PO rule', async () => {
      const pr2 = await createPR('approved');
      const r1 = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: pr2, supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 } ]
      });
      await request(app).post(`/api/v1/purchase-orders/${r1.body.data._id}/cancel`).set('Cookie', adminToken);
      
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: pr2, supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 } ]
      });
      expect(res.statusCode).toBe(201);
    });

    it('18. Updating the existing PO without changing PR -> succeeds and does NOT detect itself as duplicate', async () => {
      const res = await request(app).patch(`/api/v1/purchase-orders/${poId}`).set('Cookie', adminToken).send({
        notes: "Updated"
      });
      expect(res.statusCode).toBe(200);
    });

    it('19. Updating PO to a PR already used by another active PO -> rejected', async () => {
      const prOther = await createPR('approved');
      await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        purchaseRequest: prOther, supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 }, { product: productB, quantity: 5, unit: unitKg, unitPrice: 10 } ]
      });

      const res = await request(app).patch(`/api/v1/purchase-orders/${poId}`).set('Cookie', adminToken).send({
        purchaseRequest: prOther
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Product / Unit Validation', () => {
    it('20. Valid product + configured unit -> succeeds', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 } ]
      });
      expect(res.statusCode).toBe(201);
    });

    it('21. Valid product + unrelated unit -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: unitL, unitPrice: 5 } ]
      });
      expect(res.statusCode).toBe(400);
    });

    it('22. Inactive product -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        supplier: supplierId, warehouse: warehouseId,
        items: [ { product: inactiveProduct, quantity: 10, unit: unitKg, unitPrice: 5 } ]
      });
      expect(res.statusCode).toBe(400);
    });

    it('23. Inactive unit -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: inactiveUnit, unitPrice: 5 } ]
      });
      expect(res.statusCode).toBe(400);
    });

    it('24. Nonexistent product -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        supplier: supplierId, warehouse: warehouseId,
        items: [ { product: new mongoose.Types.ObjectId().toString(), quantity: 10, unit: unitKg, unitPrice: 5 } ]
      });
      expect(res.statusCode).toBe(404);
    });

    it('25. Nonexistent unit -> rejected', async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: new mongoose.Types.ObjectId().toString(), unitPrice: 5 } ]
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Server Authority Regression', () => {
    let poId;
    beforeAll(async () => {
      const res = await request(app).post('/api/v1/purchase-orders').set('Cookie', adminToken).send({
        supplier: supplierId, warehouse: warehouseId,
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5 } ]
      });
      poId = res.body.data._id;
    });

    it('26. Client totalPrice manipulation -> ignored/rejected', async () => {
      const res = await request(app).patch(`/api/v1/purchase-orders/${poId}`).set('Cookie', adminToken).send({
        totalPrice: 9999
      });
      expect(res.statusCode).toBe(422); // Not in Joi schema
    });

    it('27. Client subtotal manipulation -> ignored/rejected', async () => {
      const res = await request(app).patch(`/api/v1/purchase-orders/${poId}`).set('Cookie', adminToken).send({
        subtotal: 9999
      });
      expect(res.statusCode).toBe(422); // Not in Joi schema
    });

    it('28. Client receivedQuantity manipulation -> ignored/rejected', async () => {
      const res = await request(app).patch(`/api/v1/purchase-orders/${poId}`).set('Cookie', adminToken).send({
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5, receivedQuantity: 10 } ]
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.items[0].receivedQuantity).toBe(0);
    });

    it('29. Client remainingQuantity manipulation -> ignored/rejected', async () => {
      const res = await request(app).patch(`/api/v1/purchase-orders/${poId}`).set('Cookie', adminToken).send({
        items: [ { product: productA, quantity: 10, unit: unitKg, unitPrice: 5, remainingQuantity: 0 } ]
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.items[0].remainingQuantity).toBe(10);
    });

    it('30. Client status manipulation -> rejected', async () => {
      const res = await request(app).patch(`/api/v1/purchase-orders/${poId}`).set('Cookie', adminToken).send({
        status: "approved"
      });
      expect(res.statusCode).toBe(422); // Not in Joi schema
    });
  });
});
