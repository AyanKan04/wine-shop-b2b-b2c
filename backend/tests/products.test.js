const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('API Module 2: Products Catalog & Tier Pricing', () => {

  it('GET /api/products - Should return all active alcohol products', async () => {
    const res = await request(app).get('/api/products');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 4);
  });

  it('GET /api/products - Should filter products by category', async () => {
    const res = await request(app).get('/api/products?category=Champagne');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data[0].category, 'Champagne');
  });

  it('GET /api/products/:id - Should return product detail with 5 tier prices', async () => {
    const res = await request(app).get('/api/products/101');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.product_id, 101);
    assert.equal(res.body.data.sku, 'SKU-SCOT-MAC18');
    assert.ok(Array.isArray(res.body.data.tier_prices));
    assert.equal(res.body.data.tier_prices.length, 5);
  });

  it('GET /api/products/:id - Should return 404 for non-existent product', async () => {
    const res = await request(app).get('/api/products/9999');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

});
