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

  it('POST /api/sales/quotations - Should create new sales quotation', async () => {
    const res = await request(app)
      .post('/api/sales/quotations')
      .send({
        rfq_id: 8842,
        offer_unit_price: 68200000,
        quantity: 150
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.quotation.rfq_id, 8842);
    assert.equal(res.body.quotation.offer_unit_price, 68200000);
  });

  it('PUT /api/sales/quotations/:id/status - Should accept quotation and generate order + invoice', async () => {
    const res = await request(app)
      .put('/api/sales/quotations/9910/status')
      .send({ status: 'ACCEPTED' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.quotation.status, 'ACCEPTED');
    assert.ok(res.body.orders.length > 2);
    assert.ok(res.body.invoices.length > 2);

    // Verify order is created as UNPAID
    const acceptedOrder = res.body.orders.find(o => o.order_number === 'ORD-2026-17642');
    assert.ok(acceptedOrder);
    assert.equal(acceptedOrder.payment_status, 'UNPAID');

    // Pay the corresponding invoice and verify payment status propagates to the order
    const invoice = res.body.invoices.find(i => i.order_number === 'ORD-2026-17642');
    assert.ok(invoice);

    const payRes = await request(app).post(`/api/finance/pay-invoice/${invoice.invoice_id}`);
    assert.equal(payRes.status, 200);
    assert.equal(payRes.body.success, true);

    const ordersRes = await request(app).get('/api/finance/credit-limit');
    // Fetch and check mapped orders list
    const orderListRes = await request(app).get('/api/orders');
    const updatedOrder = orderListRes.body.data.find(o => o.order_number === 'ORD-2026-17642');
    assert.ok(updatedOrder);
    assert.equal(updatedOrder.payment_status, 'PAID');
  });

});
