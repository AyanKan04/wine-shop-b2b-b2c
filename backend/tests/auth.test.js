const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('API Module 1: Authentication & User Management (Real DB)', () => {

  let testToken = '';
  // Generate random prefix to ensure tests don't fail due to unique constraint on repeated runs
  const randomPrefix = Math.floor(Math.random() * 100000);
  const testUsername = `test_buyer_${randomPrefix}`;
  const testEmail = `test_${randomPrefix}@company.com`;
  
  it('POST /api/auth/register - Should register a new B2B user into Real DB', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: testUsername,
        email: testEmail,
        password: 'Password123!',
        company_name: `TEST COMPANY ${randomPrefix}`,
        tax_code: `030${randomPrefix}`
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.username, testUsername);
    assert.equal(res.body.data.user_type, 'BUYER_REP');

    // Auto-approve test user and company for login test
    const { getPool } = require('../src/config/db');
    const pool = await getPool();
    await pool.query("UPDATE users SET status = 'ACTIVE' WHERE username = $1", [testUsername]);
    await pool.query("UPDATE companies SET status = 'APPROVED' WHERE company_id = (SELECT company_id FROM users WHERE username = $1)", [testUsername]);
  });



  it('POST /api/auth/login - Should successfully authenticate user and return real JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUsername,
        password: 'Password123!'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token); // The token must exist
    assert.equal(res.body.user.username, testUsername);
    assert.equal(res.body.user.user_type, 'BUYER_REP');
    
    // Save token for next test
    testToken = res.body.token;
  });

  it('POST /api/auth/login - Should fail if credentials are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Vui lòng nhập/);
  });

  it('POST /api/auth/login - Should fail if password is incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUsername,
        password: 'WrongPassword!'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Mật khẩu không chính xác/);
  });

  it('GET /api/auth/me - Should return current logged in user details using real JWT', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${testToken}`); // Use the real token!

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.username, testUsername);
    assert.equal(res.body.data.user_type, 'BUYER_REP');
    assert.ok(res.body.data.company);
    assert.equal(res.body.data.company.company_name, `TEST COMPANY ${randomPrefix}`);
  });

  it('POST /api/auth/login - Should successfully authenticate the PLATFORM_ADMIN account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'Password123!'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.username, 'admin');
    assert.equal(res.body.user.user_type, 'PLATFORM_ADMIN');
  });



});
