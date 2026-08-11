const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

describe('API Module 3: Company & Alcohol License Verification', () => {

  let adminToken = '';

  before(async () => {
    adminToken = jwt.sign(
      { user_id: 2, username: 'admin_user', user_type: 'PLATFORM_ADMIN', company_id: 2 },
      process.env.JWT_SECRET || 'RuuB2BSuperSecretKey2024',
      { expiresIn: '1h' }
    );
  });

  it('POST /api/companies/register - Should register company and license for approval', async () => {
    const ts = Date.now();
    const res = await request(app)
      .post('/api/companies/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        company_name: `CÔNG TY CP KHÁCH SẠN CARAVELLE ${ts}`,
        tax_code: `030${ts.toString().slice(-7)}`,
        license_number: `888/GP-BCT-${ts}`
      });

    assert.ok(res.status === 200 || res.status === 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.company);
  });


  it('GET /api/admin/licenses - Should list licenses for admin review', async () => {
    const res = await request(app)
      .get('/api/admin/licenses')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/admin/licenses/:id/approve - Should approve valid license', async () => {
    const res = await request(app)
      .post('/api/admin/licenses/2/approve')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /Đã phê duyệt/);
  });

});

