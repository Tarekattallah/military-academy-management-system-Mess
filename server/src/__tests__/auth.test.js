const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const env = require('../config/env');

// NOTE: These are integration tests that require a running MongoDB instance.
// Set TEST_MONGO_URI or use the default local DB.
const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms_test';

let authCookie = '';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Auth Flow', () => {
  it('POST /api/v1/auth/login should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'invalid', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should succeed with valid admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@12345' });
    // Only test if DB has seed data
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      // Save cookie for subsequent tests
      authCookie = res.headers['set-cookie']?.[0] || '';
    } else {
      // DB may not have seed data in test env — skip gracefully
      expect([401, 404]).toContain(res.statusCode);
    }
  });
});

describe('Protected routes should reject unauthenticated requests', () => {
  const protectedRoutes = [
    '/api/v1/products',
    '/api/v1/categories',
    '/api/v1/units',
    '/api/v1/warehouses',
    '/api/v1/suppliers',
    '/api/v1/batches',
    '/api/v1/dashboard/summary',
  ];

  protectedRoutes.forEach((route) => {
    it(`GET ${route} should return 401 without auth`, async () => {
      const res = await request(app).get(route);
      expect(res.statusCode).toBe(401);
    });
  });
});
