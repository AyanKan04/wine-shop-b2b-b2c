const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

describe('API Module 4 & 5: RFQs, Quotations, Finance & Orders', () => {

  let adminToken = '';
  let buyerToken = '';
  let testRFQId = null;
  let testQuotationId = null;

  before(async () => {
    const secret = process.env.JWT_SECRET || 'RuuB2BSuperSecretKey2024';
    adminToken = jwt.sign(
      { user_id: 2, username: 'admin', user_type: 'PLATFORM_ADMIN', company_id: 2 },
      secret,
      { expiresIn: '1h' }
    );
    buyerToken = jwt.sign(
      { user_id: 1, username: 'lotte_buyer', user_type: 'BUYER_REP', company_id: 1 },
      secret,
      { expiresIn: '1h' }
    );
  });

  it('GET /api/rfqs - Should return list of submitted RFQs', async () => {
    const res = await request(app)
      .get('/api/rfqs')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/rfqs - Should create a new buyer RFQ', async () => {
    const res = await request(app)
      .post('/api/rfqs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Dynamic Test RFQ',
        requested_quantity: 10,
        target_price: 1000000
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.rfq);

    testRFQId = res.body.rfq.rfq_id;
  });

  it('GET /api/finance/credit-limit - Should return Net-30 credit limit and invoices', async () => {
    const res = await request(app)
      .get('/api/finance/credit-limit')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.credit);
    assert.ok(Array.isArray(res.body.invoices));
  });

  it('POST /api/sales/quotations - Should create new sales quotation', async () => {
    assert.ok(testRFQId);
    const res = await request(app)
      .post('/api/sales/quotations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        rfq_id: testRFQId,
        offer_unit_price: 950000,
        quantity: 10
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.quotation);
    testQuotationId = res.body.quotation.quotation_id;
  });

  it('PUT /api/sales/quotations/:id/status - Should accept quotation and generate order + invoice', async () => {
    assert.ok(testQuotationId);
    const res = await request(app)
      .put(`/api/sales/quotations/${testQuotationId}/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: 'ACCEPTED' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

});


