const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('API Module 6: Warehouse Stock Adjustments & Shipment Tracking', () => {

  it('GET /api/warehouse/inventory - Should return inventory lists', async () => {
    const res = await request(app).get('/api/warehouse/inventory');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.inventory));
  });

  it('POST /api/warehouse/inventory/adjust - Should adjust inventory (IMPORT)', async () => {
    const res = await request(app)
      .post('/api/warehouse/inventory/adjust')
      .send({
        product_id: 101,
        adjustment_type: 'IMPORT',
        quantity: 50,
        reason: 'Lô hàng nhập mới'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /Đã nhập kho/);
  });

  it('POST /api/warehouse/inventory/adjust - Should adjust inventory (EXPORT)', async () => {
    const res = await request(app)
      .post('/api/warehouse/inventory/adjust')
      .send({
        product_id: 101,
        adjustment_type: 'EXPORT',
        quantity: 10,
        reason: 'Hủy hàng lỗi mẫu'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /Đã xuất kho/);
  });

  it('GET /api/warehouse/shipments - Should return all shipments', async () => {
    const res = await request(app).get('/api/warehouse/shipments');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/warehouse/shipments - Should create shipment', async () => {
    const res = await request(app)
      .post('/api/warehouse/shipments')
      .send({
        buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
        carrier: 'Giao Hàng Nhanh (GHN)',
        items_summary: 'Macallan 18 x 5 thùng'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.shipment.tracking_number);
  });

  it('PUT /api/warehouse/shipments/:id/status - Should update status', async () => {
    const res = await request(app)
      .put('/api/warehouse/shipments/1/status')
      .send({ status: 'IN_TRANSIT' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.shipment.shipment_status, 'IN_TRANSIT');
  });

});

describe('API Module 7: Finance & Credit Control Updates', () => {

  it('PUT /api/finance/credit-limit - Should update credit limit for buyer company', async () => {
    const res = await request(app)
      .put('/api/finance/credit-limit')
      .send({ total_limit: 2000000000 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.credit.total_limit, 2000000000);
  });

  it('GET /api/finance/summary - Should return financial summary report', async () => {
    const res = await request(app).get('/api/finance/summary');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.summary.total_invoiced);
  });

});

describe('API Module 8: Unified Dashboard Analytics, Notifications & Activity Trail', () => {

  it('GET /api/dashboard/stats - Should return platform-wide KPI stats', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.stats.total_revenue);
  });

  it('GET /api/dashboard/activity - Should return system activities feed', async () => {
    const res = await request(app).get('/api/dashboard/activity?limit=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length <= 5);
  });

  it('GET /api/dashboard/notifications - Should return notification listings', async () => {
    const res = await request(app).get('/api/dashboard/notifications');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

});
