const { dbMock } = require('../config/db');

// Helper to query Gemini API if GEMINI_API_KEY is configured in env
async function queryGeminiAI(userText) {
  const geminiKeys = [
    process.env.GEMINI_API_KEY_0,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY,
    process.env.AI_API_KEY
  ].filter(Boolean);

  if (geminiKeys.length === 0) {
    return null; // Fallback to local rule-based engine
  }
  
  // Pick a random key
  const apiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];

  const systemInstruction = `You are the Red Apron AI Sommelier Assistant. You help B2B partners with wine/spirits catalog specs, MOQ checks, and wholesale discount tiers.
Rules:
1. Speak in a professional, polite, and luxury expert tone.
2. Answer in Vietnamese.
3. NEVER use any emojis in your response (emojis are strictly banned by design guidelines).
4. Use the following product catalog as your single source of truth for prices, tier discounts, regions, and MOQ:
${JSON.stringify(dbMock.products, null, 2)}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemInstruction },
              { text: `User message: ${userText}` }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      console.warn('Gemini API call failed with status:', response.status);
      return null;
    }

    const resData = await response.json();
    if (resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts[0]) {
      // Remove any accidental emojis from AI output just to be safe
      return resData.candidates[0].content.parts[0].text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
    }
  } catch (err) {
    console.error('Error calling Gemini AI:', err.message);
  }
  return null;
}

// Retrieve message log for an RFQ
const getChatHistory = (req, res) => {
  const rfqId = parseInt(req.params.id);
  const messages = dbMock.rfq_messages.filter(m => m.rfq_id === rfqId);
  res.json({ success: true, count: messages.length, data: messages });
};

// Send a chat message with AI Sommelier trigger hook
const sendMessage = async (req, res) => {
  const rfqId = parseInt(req.params.id);
  const { sender_name, sender_role, message_text } = req.body;

  if (!message_text) {
    return res.status(400).json({ success: false, message: 'Nội dung tin nhắn là bắt buộc' });
  }

  // 1. Save Buyer or Sales message
  const newMessage = {
    message_id: dbMock.rfq_messages.length + 1,
    rfq_id: rfqId,
    sender_name: sender_name || 'Anonymous',
    sender_role: sender_role || 'BUYER',
    message_text: message_text.trim(),
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  dbMock.rfq_messages.push(newMessage);

  // 2. Trigger AI Sommelier if tagged "@ai" or if message is explicitly requesting Sommelier assist
  const lowerMsg = message_text.toLowerCase();
  const needsAiResponse = lowerMsg.includes('@ai') || lowerMsg.includes('sommelier') || lowerMsg.includes('tư vấn') || lowerMsg.includes('chiết khấu');

  if (needsAiResponse) {
    let aiResponseText = null;

    // 2a. Try real Gemini AI if API Key is configured
    aiResponseText = await queryGeminiAI(message_text);

    // 2b. Fallback to Local Rule-Based Sommelier Engine if real AI is unavailable
    if (!aiResponseText) {
      aiResponseText = 'Xin chào, tôi là trợ lý AI Sommelier từ Red Apron. Tôi có thể hỗ trợ quý khách về chiết khấu sỉ, kiểm tra MOQ sản phẩm hoặc giới thiệu các dòng vang/spirits đẳng cấp.';

      if (lowerMsg.includes('macallan') || lowerMsg.includes('whisky')) {
        const macallan = dbMock.products.find(p => p.sku === 'SKU-SCOT-MAC18');
        if (macallan) {
          aiResponseText = `Đối với dòng Macallan 18 Year Old Sherry Oak: MOQ tối thiểu là ${macallan.moq} thùng. Bảng giá chiết khấu: Tier 1 là ${macallan.tier_prices[0].price_per_unit.toLocaleString('vi-VN')} đ/thùng; Tier 5 mua trên 200 thùng giảm còn ${macallan.tier_prices[4].price_per_unit.toLocaleString('vi-VN')} đ/thùng (tiết kiệm đến 24%). Quý khách có muốn Sales Rep soạn thảo báo giá chính thức không?`;
        }
      } else if (lowerMsg.includes('margaux') || lowerMsg.includes('vang') || lowerMsg.includes('wine')) {
        const margaux = dbMock.products.find(p => p.sku === 'SKU-FR-MARGAUX2018');
        if (margaux) {
          aiResponseText = `Dòng Château Margaux Premier Grand Cru Classé 2018 là biểu tượng vùng Margaux Bordeaux Pháp. Niên vụ 2018 có nồng độ 13.5% ABV. MOQ tối thiểu là ${margaux.moq} thùng. Bậc chiết khấu cao nhất (Tier 5 trên 500 thùng) có giá ${margaux.tier_prices[4].price_per_unit.toLocaleString('vi-VN')} đ/thùng, tiết kiệm 29% so với giá gốc.`;
        }
      } else if (lowerMsg.includes('dom') || lowerMsg.includes('champagne') || lowerMsg.includes('sâm panh')) {
        const dom = dbMock.products.find(p => p.sku === 'SKU-FR-DOM2012');
        if (dom) {
          aiResponseText = `Dom Pérignon Vintage Brut Champagne 2012 là sâm-panh Pháp trứ danh niên hiệu 2012. Nồng độ 12.5% ABV, MOQ từ ${dom.moq} thùng. Bảng giá ưu đãi: Mua từ 8 thùng giá ${dom.tier_prices[0].price_per_unit.toLocaleString('vi-VN')} đ; trên 300 thùng áp dụng Tier 5 giá chỉ còn ${dom.tier_prices[4].price_per_unit.toLocaleString('vi-VN')} đ/thùng.`;
        }
      } else if (lowerMsg.includes('hennessy') || lowerMsg.includes('cognac')) {
        const hennessy = dbMock.products.find(p => p.sku === 'SKU-FR-HENNESSY-XO');
        if (hennessy) {
          aiResponseText = `Hennessy X.O Cognac Extra Old Edition có niên vụ 2020, nồng độ 40% ABV. MOQ tối thiểu là ${hennessy.moq} thùng. Khi đặt hàng số lượng lớn (trên 200 thùng), quý khách nhận chiết khấu Tier 5 với đơn giá chỉ ${hennessy.tier_prices[4].price_per_unit.toLocaleString('vi-VN')} đ/thùng.`;
        }
      } else if (lowerMsg.includes('hạn mức') || lowerMsg.includes('tín dụng') || lowerMsg.includes('net-30')) {
        aiResponseText = `Chính sách tín dụng Net-30 của Red Apron cho phép quý khách mua sắm trả sau trong vòng 30 ngày. Hạn mức khả dụng hiện tại của quý khách được hiển thị trực tiếp trên thẻ công nợ. Vui lòng thanh toán hóa đơn đúng hạn để khôi phục hạn mức khả dụng tự động.`;
      }
    }

    // Append AI Response to database
    const aiMessage = {
      message_id: dbMock.rfq_messages.length + 1,
      rfq_id: rfqId,
      sender_name: 'AI Sommelier Assistant',
      sender_role: 'AI_ASSISTANT',
      message_text: aiResponseText.trim(),
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    dbMock.rfq_messages.push(aiMessage);
  }

  // Retrieve full updated history to return
  const updatedMessages = dbMock.rfq_messages.filter(m => m.rfq_id === rfqId);
  res.json({ success: true, data: updatedMessages });
};

module.exports = {
  getChatHistory,
  sendMessage
};
