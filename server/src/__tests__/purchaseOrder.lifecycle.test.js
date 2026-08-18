/* eslint-env jest */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const env = require('../config/env');
const Warehouse = require('../models/warehouse.model');
const Supplier = require('../models/supplier.model');
const Product = require('../models/product.model');
const Unit = require('../models/unit.model');
const { signToken } = require('../utils/jwt');
const PurchaseOrder = require('../models/purchaseOrder.model');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms_test';

let adminToken = '';
let storeKeeperToken = '';
let warehouseId = '';
let supplierId = '';
let productId = '';
let unitId = '';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
  await mongoose.connection.db.dropDatabase();
  
  // Create mock users
  const adminId = new mongoose.Types.ObjectId();
  const storeKeeperId = new mongoose.Types.ObjectId();

  adminToken = `${env.cookieName}=` + signToken({
    sub: adminId.toString(),
    username: 'admin',
    roles: ['Super Administrator'],
    permissions: ['purchase-orders:view', 'purchase-orders:update', 'purchase-orders:approve', 'purchase-orders:create', 'purchase-orders:delete']
  });

  storeKeeperToken = `${env.cookieName}=` + signToken({
    sub: storeKeeperId.toString(),
    username: 'store.keeper',
    roles: ['Store Keeper'],
    permissions: ['purchase-orders:view', 'purchase-orders:update', 'purchase-orders:create'] // no approve
  });
  
  // Create test data
  const wh = await Warehouse.create({ name: 'Test WH', code: 'WH1', isActive: true });
  warehouseId = wh._id.toString();
  
  const sup = await Supplier.create({ name: 'Test Supplier', code: 'SUP1', isActive: true });
  supplierId = sup._id.toString();

  const unit = await Unit.create({ name: 'Kilogram', abbreviation: 'kg', type: 'weight', category: 'weight', isActive: true });
  unitId = unit._id.toString();
  
  const product = await Product.create({ name: 'Rice', category: new mongoose.Types.ObjectId(), unit: unitId, isActive: true });
  productId = product._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 1.1-B: Purchase Order Lifecycle Hardening', () => {
  let poId;

  it('1. Create draft PO', async () => {
    const res = await request(app)
      .post('/api/v1/purchase-orders')
      .set('Cookie', adminToken)
      .send({
        supplier: supplierId,
        warehouse: warehouseId,
        items: [{ product: productId, quantity: 10, unit: unitId, unitPrice: 5 }]
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.subtotal).toBe(50); // Server calculated
    poId = res.body.data._id;
  });

  it('12. Direct status update -> rejected', async () => {
    const res = await request(app)
      .patch(`/api/v1/purchase-orders/${poId}`)
      .set('Cookie', adminToken)
      .send({ status: 'approved' });
    expect(res.statusCode).toBe(422); // Joi validation blocks it
  });

  it('13. Direct receivedQuantity update -> stripped', async () => {
    const res = await request(app)
      .patch(`/api/v1/purchase-orders/${poId}`)
      .set('Cookie', adminToken)
      .send({ items: [{ product: productId, quantity: 10, unit: unitId, unitPrice: 5, receivedQuantity: 10 }] });
    expect(res.statusCode).toBe(200); 
    expect(res.body.data.items[0].receivedQuantity).toBe(0);
  });

  it('14. Direct remainingQuantity update -> stripped', async () => {
    const res = await request(app)
      .patch(`/api/v1/purchase-orders/${poId}`)
      .set('Cookie', adminToken)
      .send({ items: [{ product: productId, quantity: 10, unit: unitId, unitPrice: 5, remainingQuantity: 0 }] });
    expect(res.statusCode).toBe(200); 
    expect(res.body.data.items[0].remainingQuantity).toBe(10);
  });

  it('15. Direct totalPrice update -> rejected', async () => {
    const res = await request(app)
      .patch(`/api/v1/purchase-orders/${poId}`)
      .set('Cookie', adminToken)
      .send({ totalPrice: 100 });
    expect(res.statusCode).toBe(422); 
  });

  it('5. Approve draft -> rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/approve`)
      .set('Cookie', adminToken);
    expect(res.statusCode).toBe(400);
  });

  it('2. Submit draft -> success', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/submit`)
      .set('Cookie', storeKeeperToken); 
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('submitted');
  });

  it('3. Submit submitted -> rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/submit`)
      .set('Cookie', storeKeeperToken);
    expect(res.statusCode).toBe(400);
  });

  it('17. Unauthorized approval -> 403', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/approve`)
      .set('Cookie', storeKeeperToken); 
    expect(res.statusCode).toBe(403);
  });

  it('4. Approve submitted -> success (18. Authorized approval)', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/approve`)
      .set('Cookie', adminToken); 
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });

  it('7. Reject approved -> rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/reject`)
      .set('Cookie', adminToken)
      .send({ reason: 'Nope' });
    expect(res.statusCode).toBe(400);
  });

  describe('Reject transitions', () => {
    let rejectPoId;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Cookie', adminToken)
        .send({
          supplier: supplierId,
          warehouse: warehouseId,
          items: [{ product: productId, quantity: 10, unit: unitId, unitPrice: 5 }]
        });
      rejectPoId = res.body.data._id;
      await request(app).post(`/api/v1/purchase-orders/${rejectPoId}/submit`).set('Cookie', adminToken);
    });

    it('6. Reject submitted -> success', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${rejectPoId}/reject`)
        .set('Cookie', adminToken)
        .send({ reason: 'Too expensive' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.rejectionReason).toBe('Too expensive');
    });
  });

  describe('Cancel transitions', () => {
    let cancelPoId;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Cookie', adminToken)
        .send({
          supplier: supplierId,
          warehouse: warehouseId,
          items: [{ product: productId, quantity: 10, unit: unitId, unitPrice: 5 }]
        });
      cancelPoId = res.body.data._id;
    });

    it('9. Cancel valid PO (draft) -> success', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${cancelPoId}/cancel`)
        .set('Cookie', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('10. Cancel cancelled PO -> rejected', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${cancelPoId}/cancel`)
        .set('Cookie', adminToken);
      expect(res.statusCode).toBe(400);
    });
    
    it('11. Cancel fully_received PO -> rejected', async () => {
      // Create a draft, then manually update DB to simulate receiving since it's backend-controlled
      const res = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Cookie', adminToken)
        .send({
          supplier: supplierId,
          warehouse: warehouseId,
          items: [{ product: productId, quantity: 10, unit: unitId, unitPrice: 5 }]
        });
      const receivedPoId = res.body.data._id;
      
      // Update directly via mongoose to bypass controller restrictions
      await PurchaseOrder.findByIdAndUpdate(receivedPoId, { 
        status: 'fully_received',
        $set: { 'items.0.receivedQuantity': 10, 'items.0.remainingQuantity': 0 }
      });
      
      const cancelRes = await request(app)
        .post(`/api/v1/purchase-orders/${receivedPoId}/cancel`)
        .set('Cookie', adminToken);
      expect(cancelRes.statusCode).toBe(400);
    });

    it('16. Soft-deleted PO lifecycle operation -> rejected', async () => {
       let delRes = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Cookie', adminToken)
        .send({
          supplier: supplierId,
          warehouse: warehouseId,
          items: [{ product: productId, quantity: 1, unit: unitId, unitPrice: 5 }]
        });
       expect(delRes.statusCode).toBe(201);
       let delId = delRes.body.data._id;
       const deleteResp = await request(app).delete(`/api/v1/purchase-orders/${delId}`).set('Cookie', adminToken);
       expect(deleteResp.statusCode).toBe(200);
       
       const subRes = await request(app).post(`/api/v1/purchase-orders/${delId}/submit`).set('Cookie', adminToken);
       expect(subRes.statusCode).toBe(404);
    });
  });
});
