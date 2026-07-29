const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('API Module 9: B2B RFQ Chat & AI Sommelier Assistant', () => {

  it('GET /api/rfqs/:id/messages - Should return chat history for an RFQ', async () => {
    const res = await request(app).get('/api/rfqs/8842/messages');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.equal(res.body.data[0].sender_role, 'SYSTEM');
  });

  it('POST /api/rfqs/:id/messages - Should send a buyer message', async () => {
    const res = await request(app)
      .post('/api/rfqs/8842/messages')
      .send({
        sender_name: 'Lotte Buyer',
        sender_role: 'BUYER',
        message_text: 'Xin chào, tôi muốn đàm phán giá tốt hơn'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    // Find the message we sent
    const sentMsg = res.body.data.find(m => m.message_text === 'Xin chào, tôi muốn đàm phán giá tốt hơn');
    assert.ok(sentMsg);
    assert.equal(sentMsg.sender_role, 'BUYER');
  });

  it('POST /api/rfqs/:id/messages - Should trigger AI Sommelier response when tagged', async () => {
    const res = await request(app)
      .post('/api/rfqs/8842/messages')
      .send({
        sender_name: 'Lotte Buyer',
        sender_role: 'BUYER',
        message_text: 'Xin tư vấn cho tôi giá sỉ và MOQ của @ai Macallan'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    // Verify that the AI Sommelier replied
    const aiResponse = res.body.data.find(m => m.sender_role === 'AI_ASSISTANT');
    assert.ok(aiResponse);
    assert.match(aiResponse.message_text, /Macallan/);
    assert.match(aiResponse.message_text, /MOQ/);
  });

});
