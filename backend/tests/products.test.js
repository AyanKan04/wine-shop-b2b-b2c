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

  it('POST /api/products - Should create a new product with tier prices', async () => {
    const newProd = {
      product_name: 'Vang Chi Lê Montes Alpha Cabernet Sauvignon',
      sku: 'SKU-CL-MONTES2021',
      category: 'Fine Wine',
      country_of_origin: 'Chile',
      moq: 6,
      alcohol_content: 14.5,
      volume_ml: 750
    };

    const res = await request(app)
      .post('/api/products')
      .send(newProd);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.sku, 'SKU-CL-MONTES2021');
    assert.equal(res.body.data.product_name, 'Vang Chi Lê Montes Alpha Cabernet Sauvignon');
  });

  it('PUT /api/products/:id - Should update product fields successfully', async () => {
    const res = await request(app)
      .put('/api/products/101')
      .send({ alcohol_content: 44.5 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.alcohol_content, 44.5);
  });

  it('DELETE /api/products/:id - Should delete product successfully', async () => {
    const res = await request(app).delete('/api/products/102');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

});
