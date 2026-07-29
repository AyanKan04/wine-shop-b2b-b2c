const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { dbMock } = require('../src/config/db');

test('API Module 10: Bank Letter of Credit (L/C) Verification & Auditing Workflow', async (t) => {
  
  await t.test('GET /api/finance/lc-documents - Should return L/C list containing sample record', async () => {
    const res = await request(app)
      .get('/api/finance/lc-documents')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.strictEqual(res.body.data[0].lc_number, 'LC-HSBC-2026-0001');
  });

  await t.test('POST /api/finance/lc-documents - Should submit a new L/C with status SUBMITTED', async () => {
    const newLCPayload = {
      lc_number: 'LC-VIETIN-2026-0002',
      issuing_bank: 'VietinBank',
      amount: 500000000,
      expiry_date: '2026-11-30',
      document_url: '/uploads/lc_lotte_vietin.pdf'
    };

    const res = await request(app)
      .post('/api/finance/lc-documents')
      .send(newLCPayload)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.lc_number, 'LC-VIETIN-2026-0002');
    assert.strictEqual(res.body.data.status, 'SUBMITTED');
  });

  await t.test('POST /api/finance/lc-documents/:id/verify - Should verify L/C and increase credit limit and available balance', async () => {
    // Find the ID of the newly submitted L/C
    const lc = dbMock.lc_documents.find(doc => doc.lc_number === 'LC-VIETIN-2026-0002');
    assert.ok(lc);

    const initialTotalLimit = dbMock.credit_limit.total_limit;
    const initialAvailableBalance = dbMock.credit_limit.available_balance;

    const res = await request(app)
      .post(`/api/finance/lc-documents/${lc.lc_id}/verify`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'VERIFIED');
    
    // Assert limits increased correctly
    assert.strictEqual(dbMock.credit_limit.total_limit, initialTotalLimit + 500000000);
    assert.strictEqual(dbMock.credit_limit.available_balance, initialAvailableBalance + 500000000);
  });

  await t.test('POST /api/finance/lc-documents/:id/reject - Should reject L/C with status REJECTED', async () => {
    // Submit another L/C to reject
    const rejectLCPayload = {
      lc_number: 'LC-VCB-2026-0003',
      issuing_bank: 'Vietcombank',
      amount: 300000000,
      expiry_date: '2026-10-15',
      document_url: '/uploads/lc_reject.pdf'
    };

    const submitRes = await request(app)
      .post('/api/finance/lc-documents')
      .send(rejectLCPayload)
      .expect(200);

    const newLcId = submitRes.body.data.lc_id;

    const res = await request(app)
      .post(`/api/finance/lc-documents/${newLcId}/reject`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'REJECTED');
  });

});
