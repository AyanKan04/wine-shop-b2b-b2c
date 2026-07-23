const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('API Module 1: Authentication & User Management', () => {

  it('POST /api/auth/login - Should successfully authenticate user and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'lotte_buyer',
        password: 'Password123!'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.username, 'lotte_buyer');
    assert.equal(res.body.user.user_type, 'BUYER_REP');
  });

  it('POST /api/auth/login - Should fail if credentials are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Vui lòng nhập/);
  });

  it('POST /api/auth/register - Should register a new B2B user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'continental_buyer',
        email: 'purchasing@continental.com',
        password: 'Password123!',
        company_name: 'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL',
        tax_code: '0309988776'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.username, 'continental_buyer');
  });

  it('GET /api/auth/me - Should return current logged in user details', async () => {
    const res = await request(app).get('/api/auth/me');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.username, 'lotte_buyer');
  });

});
