const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('API Module 4 & 5: RFQs, Quotations, Finance & Orders', () => {

  it('GET /api/rfqs - Should return list of submitted RFQs', async () => {
    const res = await request(app).get('/api/rfqs');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/rfqs - Should create a new buyer RFQ', async () => {
    const res = await request(app)
      .post('/api/rfqs')
      .send({
        product_name: 'Dom Pérignon Vintage Brut Champagne 2012',
        quantity: 100,
        target_price: 36000000
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.rfq.quantity, 100);
  });

  it('GET /api/finance/credit-limit - Should return Net-30 credit limit and invoices', async () => {
    const res = await request(app).get('/api/finance/credit-limit');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.credit);
    assert.ok(Array.isArray(res.body.invoices));
  });

  it('POST /api/finance/pay-invoice/:id - Should process invoice payment and restore credit', async () => {
    const res = await request(app).post('/api/finance/pay-invoice/104');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /Thanh toán hóa đơn thành công/);
  });

});
