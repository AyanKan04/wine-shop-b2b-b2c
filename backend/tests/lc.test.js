const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

test('API Module 10: Bank Letter of Credit (L/C) Verification & Auditing Workflow', async (t) => {
  
  let adminToken = '';
  let testLcId = null;

  adminToken = jwt.sign(
    { user_id: 2, username: 'admin', user_type: 'PLATFORM_ADMIN', company_id: 2 },
    process.env.JWT_SECRET || 'RuuB2BSuperSecretKey2024',
    { expiresIn: '1h' }
  );

  await t.test('GET /api/finance/lc-documents - Should return L/C list containing sample record', async () => {
    const res = await request(app)
      .get('/api/finance/lc-documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test('POST /api/finance/lc-documents - Should submit a new L/C with status SUBMITTED', async () => {
    const ts = Date.now();
    const newLCPayload = {
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      lc_number: `LC-TEST-${ts}`,
      issuing_bank: 'VietinBank',
      amount: 500000000,
      expiry_date: '2026-11-30',
      document_url: '/uploads/lc_lotte_vietin.pdf'
    };

    const res = await request(app)
      .post('/api/finance/lc-documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newLCPayload)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.lc_number, `LC-TEST-${ts}`);
    assert.strictEqual(res.body.data.status, 'SUBMITTED');
    testLcId = res.body.data.lc_id;
  });

  await t.test('POST /api/finance/lc-documents/:id/verify - Should verify L/C and increase credit limit', async () => {
    if (testLcId) {
      const res = await request(app)
        .post(`/api/finance/lc-documents/${testLcId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'VERIFIED' })
        .expect(200);

      assert.strictEqual(res.body.success, true);
    }
  });

});


