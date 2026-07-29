const { dbMock } = require('../config/db');

// Retrieve message log for an RFQ
const getChatHistory = (req, res) => {
  const rfqId = parseInt(req.params.id);
  const messages = dbMock.rfq_messages.filter(m => m.rfq_id === rfqId);
  res.json({ success: true, count: messages.length, data: messages });
};

// Send a chat message with AI Sommelier trigger hook
const sendMessage = (req, res) => {
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
    let aiResponseText = 'Xin chào, tôi là trợ lý AI Sommelier từ Red Apron. Tôi có thể hỗ trợ quý khách về chiết khấu sỉ, kiểm tra MOQ sản phẩm hoặc giới thiệu các dòng vang/spirits đẳng cấp.';

    // Sommelier checks for product specifications
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

    // Append AI Response to database
    const aiMessage = {
      message_id: dbMock.rfq_messages.length + 1,
      rfq_id: rfqId,
      sender_name: 'AI Sommelier Assistant',
      sender_role: 'AI_ASSISTANT',
      message_text: aiResponseText,
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
