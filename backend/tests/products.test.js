const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

describe('API Module 2: Products Catalog & Tier Pricing', () => {

  let adminToken = '';
  let sampleProductId = null;
  let createdProductId = null;

  before(async () => {
    adminToken = jwt.sign(
      { user_id: 2, username: 'admin', user_type: 'PLATFORM_ADMIN', company_id: 2 },
      process.env.JWT_SECRET || 'RuuB2BSuperSecretKey2024',
      { expiresIn: '1h' }
    );
  });

  it('GET /api/products - Should return all active alcohol products', async () => {
    const res = await request(app).get('/api/products');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    sampleProductId = res.body.data[0].product_id;
  });

  it('GET /api/products/:id - Should return product detail', async () => {
    assert.ok(sampleProductId);
    const res = await request(app).get(`/api/products/${sampleProductId}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.product_id, sampleProductId);
  });

  it('GET /api/products/:id - Should return 404 for non-existent product', async () => {
    const res = await request(app).get('/api/products/999999');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it('POST /api/products - Should create a new product', async () => {
    const ts = Date.now();
    const newProd = {
      product_name: `Vang Test ${ts}`,
      sku: `SKU-TEST-${ts}`,
      category: 'Fine Wine',
      country_of_origin: 'Chile',
      moq: 6,
      alcohol_content: 14.5,
      volume_ml: 750
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProd);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.sku, `SKU-TEST-${ts}`);
    createdProductId = res.body.data.product_id;
  });

  it('PUT /api/products/:id - Should update product fields successfully', async () => {
    assert.ok(createdProductId || sampleProductId);
    const targetId = createdProductId || sampleProductId;

    const res = await request(app)
      .put(`/api/products/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ alcohol_content: 15.0 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('DELETE /api/products/:id - Should delete created test product', async () => {
    if (createdProductId) {
      const res = await request(app)
        .delete(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    }
  });

});


