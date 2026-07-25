const request = require('supertest');
const app = require('../app');

describe('Health Check', () => {
  it('GET /api/v1/health should return 200 with success', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
