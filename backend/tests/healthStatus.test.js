const request = require('supertest');
const app = require('../server');

describe('Health and status endpoints', () => {
  it('GET /health should return OK', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('environment');
  });

  it('GET /api/status should return operational status and endpoints', async () => {
    const res = await request(app).get('/api/status');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'operational');
    expect(res.body).toHaveProperty('service', 'NetisTrackGh Backend API');
    expect(res.body).toHaveProperty('endpoints');
    expect(res.body.endpoints).toHaveProperty('health', '/health');
    expect(res.body.endpoints).toHaveProperty('apiStatus', '/api/status');
  });
});
