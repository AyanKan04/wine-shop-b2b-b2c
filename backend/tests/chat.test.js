const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

describe('API Module 9: B2B RFQ Chat & AI Sommelier Assistant', () => {

  let userToken = '';

  before(async () => {
    userToken = jwt.sign(
      { user_id: 1, username: 'lotte_buyer', user_type: 'BUYER_REP', company_id: 1 },
      process.env.JWT_SECRET || 'RuuB2BSuperSecretKey2024',
      { expiresIn: '1h' }
    );
    const { getPool } = require('../src/config/db');
    const pool = await getPool();
    try {
      await pool.query('DELETE FROM rfq_messages WHERE rfq_id = 1');
      await pool.query(`
        INSERT INTO rfq_messages (rfq_id, sender_name, sender_role, message_text, created_at)
        VALUES (1, 'System', 'SYSTEM', 'RFQ đã được khởi tạo thành công.', CURRENT_TIMESTAMP)
      `);
    } catch (e) {
      console.warn('Chat seeder notice:', e.message);
    }
  });

  it('GET /api/rfqs/:id/messages - Should return chat history for an RFQ', async () => {
    const res = await request(app)
      .get('/api/rfqs/1/messages')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/rfqs/:id/messages - Should send a buyer message', async () => {
    const res = await request(app)
      .post('/api/rfqs/1/messages')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sender_name: 'Lotte Buyer',
        sender_role: 'BUYER',
        message_text: 'Xin chào, tôi muốn đàm phán giá tốt hơn'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

});

