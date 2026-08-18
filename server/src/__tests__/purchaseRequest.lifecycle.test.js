/* eslint-env jest */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const env = require('../config/env');
const Warehouse = require('../models/warehouse.model');
const Product = require('../models/product.model');
const Unit = require('../models/unit.model');
const { signToken } = require('../utils/jwt');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms_test';

let adminToken = '';
let storeKeeperToken = '';
let warehouseId = '';
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
    permissions: ['purchase-requests:update', 'purchase-requests:approve', 'purchase-requests:create', 'purchase-requests:delete']
  });

  storeKeeperToken = `${env.cookieName}=` + signToken({
    sub: storeKeeperId.toString(),
    username: 'store.keeper',
    roles: ['Store Keeper'],
    permissions: ['purchase-requests:update', 'purchase-requests:create'] // no approve
  });
  
  // Create test data
  const wh = await Warehouse.create({ name: 'Test WH', code: 'WH1', isActive: true });
  warehouseId = wh._id.toString();
  
  const unit = await Unit.create({ name: 'Kilogram', abbreviation: 'kg', type: 'weight', category: 'weight', isActive: true });
  unitId = unit._id.toString();
  
  const product = await Product.create({ name: 'Rice', category: new mongoose.Types.ObjectId(), unit: unitId, isActive: true });
  productId = product._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 1.1-A: Purchase Request Lifecycle Hardening', () => {
  let prId;

  it('1. Create draft PR', async () => {
    const res = await request(app)
      .post('/api/v1/purchase-requests')
      .set('Cookie', adminToken)
      .send({
        warehouse: warehouseId,
        items: [{ product: productId, quantity: 10, unit: unitId }]
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('draft');
    prId = res.body.data._id;
  });

  it('9. Direct status update through generic update -> rejected', async () => {
    const res = await request(app)
      .patch(`/api/v1/purchase-requests/${prId}`)
      .set('Cookie', adminToken)
      .send({ status: 'approved' });
    expect(res.statusCode).toBe(422); 
  });

  it('5. Approve draft -> rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-requests/${prId}/approve`)
      .set('Cookie', adminToken);
    expect(res.statusCode).toBe(400);
  });

  it('2. Submit draft -> success', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-requests/${prId}/submit`)
      .set('Cookie', storeKeeperToken); 
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('submitted');
  });

  it('3. Submit submitted -> rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-requests/${prId}/submit`)
      .set('Cookie', storeKeeperToken);
    expect(res.statusCode).toBe(400);
  });

  it('13. Unauthorized approval -> rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-requests/${prId}/approve`)
      .set('Cookie', storeKeeperToken); 
    expect(res.statusCode).toBe(403);
  });

  it('4. Approve submitted -> success (14. Authorized approval)', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-requests/${prId}/approve`)
      .set('Cookie', adminToken); 
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });

  it('7. Reject approved -> rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-requests/${prId}/reject`)
      .set('Cookie', adminToken)
      .send({ reason: 'Nope' });
    expect(res.statusCode).toBe(400);
  });

  it('8. Invalid transition -> rejected (cancel approved PR)', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-requests/${prId}/cancel`)
      .set('Cookie', adminToken);
    expect(res.statusCode).toBe(400);
  });

  describe('Reject transitions', () => {
    let rejectPrId;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/purchase-requests')
        .set('Cookie', adminToken)
        .send({
          warehouse: warehouseId,
          items: [{ product: productId, quantity: 10, unit: unitId }]
        });
      rejectPrId = res.body.data._id;
      await request(app).post(`/api/v1/purchase-requests/${rejectPrId}/submit`).set('Cookie', adminToken);
    });

    it('6. Reject submitted -> success', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-requests/${rejectPrId}/reject`)
        .set('Cookie', adminToken)
        .send({ reason: 'Too expensive' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.rejectionReason).toBe('Too expensive');
    });
  });

  describe('Cancel transitions', () => {
    let cancelPrId;
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/purchase-requests')
        .set('Cookie', adminToken)
        .send({
          warehouse: warehouseId,
          items: [{ product: productId, quantity: 10, unit: unitId }]
        });
      cancelPrId = res.body.data._id;
    });

    it('10. Cancel valid PR (draft) -> success', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-requests/${cancelPrId}/cancel`)
        .set('Cookie', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('11. Cancel cancelled PR -> rejected', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-requests/${cancelPrId}/cancel`)
        .set('Cookie', adminToken);
      expect(res.statusCode).toBe(400);
    });
    
    it('12. Operate on soft-deleted PR -> rejected', async () => {
       let delRes = await request(app)
        .post('/api/v1/purchase-requests')
        .set('Cookie', adminToken)
        .send({
          warehouse: warehouseId,
          items: [{ product: productId, quantity: 1, unit: unitId }]
        });
       let delId = delRes.body.data._id;
       await request(app).delete(`/api/v1/purchase-requests/${delId}`).set('Cookie', adminToken);
       
       const subRes = await request(app).post(`/api/v1/purchase-requests/${delId}/submit`).set('Cookie', adminToken);
       expect(subRes.statusCode).toBe(404);
    });
  });
});
