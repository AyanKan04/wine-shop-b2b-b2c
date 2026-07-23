const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('API Module 3: Company & Alcohol License Verification', () => {

  it('POST /api/companies/register - Should register company and license for approval', async () => {
    const res = await request(app)
      .post('/api/companies/register')
      .send({
        company_name: 'CÔNG TY CP KHÁCH SẠN CARAVELLE',
        tax_code: '0307778899',
        license_number: '888/GP-BCT'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.company.company_name, 'CÔNG TY CP KHÁCH SẠN CARAVELLE');
  });

  it('GET /api/admin/licenses - Should list licenses for admin review', async () => {
    const res = await request(app).get('/api/admin/licenses');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/admin/licenses/:id/approve - Should approve valid license', async () => {
    const res = await request(app).post('/api/admin/licenses/2/approve');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /Đã phê duyệt/);
  });

});
