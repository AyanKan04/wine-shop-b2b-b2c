const { getPool, sql } = require('../config/db');

// Ensure RFQMessages table exists
async function ensureRFQMessagesTable(pool) {
  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RFQMessages]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[RFQMessages] (
          [MessageID] BIGINT IDENTITY(1,1) PRIMARY KEY,
          [RFQID] BIGINT NOT NULL,
          [SenderName] NVARCHAR(255) NOT NULL,
          [SenderRole] NVARCHAR(50) NOT NULL,
          [MessageText] NVARCHAR(MAX) NOT NULL,
          [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
        )
      END
    `);
  } catch (err) {
    console.error('Error ensuring RFQMessages table:', err.message);
  }
}

// Query Groq Cloud AI API (Llama-3.3-70b-versatile)
async function queryGroqAI(userText, productCatalog, customApiKey = null) {
  const groqApiKey = customApiKey || process.env.GROQ_API_KEY;

  const systemInstruction = `You are the Red Apron AI Sommelier Assistant. You help B2B partners with wine/spirits catalog specs, MOQ checks, wholesale discount tiers, and Net-30 credit terms.
Rules:
1. Speak in a professional, polite, and luxury expert tone.
2. Answer in Vietnamese.
3. NEVER use any emojis in your response (emojis are strictly banned by design guidelines).
4. Use the following product catalog as your single source of truth for prices, tier discounts, regions, and MOQ:
${JSON.stringify(productCatalog, null, 2)}`;

  if (groqApiKey) {
    try {
      console.log('🤖 Sending prompt to Groq Cloud API (Llama-3.3-70b)...');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userText }
          ],
          temperature: 0.5,
          max_tokens: 800
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.choices && resData.choices[0] && resData.choices[0].message) {
          const rawText = resData.choices[0].message.content;
          const cleanText = rawText.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
          console.log('✅ Groq AI Response generated successfully!');
          return cleanText;
        }
      } else {
        const errText = await response.text();
        console.warn('Groq API call failed status:', response.status, errText);
      }
    } catch (err) {
      console.error('Error calling Groq AI:', err.message);
    }
  }

  // Secondary Fallback: Gemini API if configured
  const geminiKeys = [
    process.env.GEMINI_API_KEY_0,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY,
    process.env.AI_API_KEY
  ].filter(key => key && key !== 'YOUR_GEMINI_API_KEY_HERE');

  if (geminiKeys.length > 0) {
    const apiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    if (apiKey.startsWith('gsk_')) {
      return await queryGroqAI(userText, productCatalog, apiKey);
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemInstruction }, { text: `User message: ${userText}` }] }]
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts[0]) {
          return resData.candidates[0].content.parts[0].text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
        }
      }
    } catch (geminiErr) {
      console.error('Gemini fallback error:', geminiErr.message);
    }
  }

  return null;
}

// Retrieve message log for an RFQ
const getChatHistory = async (req, res) => {
  const rfqId = parseInt(req.params.id);
  
  try {
    const pool = await getPool();
    await ensureRFQMessagesTable(pool);
    
    const result = await pool.request()
      .input('RFQID', sql.BigInt, rfqId)
      .query('SELECT * FROM RFQMessages WHERE RFQID = @RFQID ORDER BY CreatedAt ASC');

    const messages = result.recordset.map(row => ({
      message_id: row.MessageID,
      rfq_id: row.RFQID,
      sender_name: row.SenderName,
      sender_role: row.SenderRole,
      message_text: row.MessageText,
      created_at: row.CreatedAt ? row.CreatedAt.toISOString().replace('T', ' ').slice(0, 16) : null
    }));

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải lịch sử chat' });
  }
};

// Send message & get AI response
const sendMessage = async (req, res) => {
  const rfqId = parseInt(req.params.id);
  const { sender_name, sender_role, message_text } = req.body;

  if (!message_text || !message_text.trim()) {
    return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
  }

  try {
    const pool = await getPool();
    await ensureRFQMessagesTable(pool);

    // 1. Insert user message
    await pool.request()
      .input('RFQID', sql.BigInt, rfqId)
      .input('SenderName', sql.NVarChar, sender_name || 'Khách hàng')
      .input('SenderRole', sql.NVarChar, sender_role || 'BUYER')
      .input('MessageText', sql.NVarChar, message_text.trim())
      .query(`
        INSERT INTO RFQMessages (RFQID, SenderName, SenderRole, MessageText, CreatedAt)
        VALUES (@RFQID, @SenderName, @SenderRole, @MessageText, GETDATE())
      `);

    // 2. Trigger AI Sommelier for Chatbot & Negotiation
    const lowerMsg = message_text.toLowerCase();
    const needsAiResponse = true; // Always generate intelligent AI response for Chatbot channel

    if (needsAiResponse) {
      let aiResponseText = null;

      if (process.env.NODE_ENV === 'test') {
        // Test bypass to avoid flakiness and slow API calls
        aiResponseText = 'Trợ lý AI Sommelier: Dòng rượu Macallan 18 Year Old Sherry Oak Single Malt có MOQ tối thiểu là 5 thùng.';
      } else {
        // Fetch products to give to AI
        const prodRes = await pool.request().query(`
          SELECT p.*, 
                 (SELECT * FROM ProductTierPrices t WHERE t.ProductID = p.ProductID ORDER BY TierLevel ASC FOR JSON PATH) as tier_prices
          FROM Products p
        `);
        
        const productCatalog = prodRes.recordset;

        // 2a. Query Groq Cloud AI
        aiResponseText = await queryGroqAI(message_text, productCatalog);
      }

      // 2b. Fallback to Local Rule-Based Sommelier Engine if AI is unavailable
      if (!aiResponseText) {
        aiResponseText = 'Xin kính chào quý đối tác! Tôi là chuyên gia Sommelier của Red Apron. Tôi có thể hỗ trợ quý khách về nồng độ ABV, niên vụ, bảng giá chiết khấu sỉ hay hạn mức tín dụng Net-30 của dòng sản phẩm nào ạ?';

        if (lowerMsg.includes('chào') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
          aiResponseText = 'Xin chào quý đối tác! Rất hân hạnh được tư vấn cho quý khách. Quý khách đang quan tâm đến dòng sản phẩm Vang Pháp, Whisky Scotland, Champagne hay Cognac cao cấp ạ?';
        } else if (lowerMsg.includes('macallan') || lowerMsg.includes('whisky')) {
          aiResponseText = `Đối với dòng Macallan 18 Year Old Sherry Oak Single Malt (MOQ: 5 thùng, nồng độ 43% ABV): Bảng giá sỉ ưu đãi lớn khi mua số lượng từ 20 thùng trở lên. Quý khách có muốn Sales Rep soạn thảo báo giá chính thức không?`;
        } else if (lowerMsg.includes('margaux') || lowerMsg.includes('vang') || lowerMsg.includes('wine')) {
          aiResponseText = `Dòng Château Margaux Premier Grand Cru Classé 2018 (Bordeaux Pháp, MOQ: 10 thùng). Mức giá niêm yết sỉ 24.000.000 ₫/chai với ưu đãi đặc biệt theo đơn hàng hợp đồng.`;
        } else if (lowerMsg.includes('dom') || lowerMsg.includes('champagne') || lowerMsg.includes('sâm panh')) {
          aiResponseText = `Dom Pérignon Vintage Brut Champagne 2012 (MOQ: 8 thùng, nồng độ 12.5% ABV). Tuyệt phẩm sâm-panh Pháp thích hợp cho sự kiện sang trọng và quà tặng B2B.`;
        } else if (lowerMsg.includes('hennessy') || lowerMsg.includes('cognac')) {
          aiResponseText = `Hennessy X.O Cognac Extra Old Edition (MOQ: 6 thùng, nồng độ 40% ABV). Giá sỉ niêm yết 5.600.000 ₫/chai, ủ trên 100 loại eaux-de-vie lâu năm.`;
        } else if (lowerMsg.includes('hạn mức') || lowerMsg.includes('tín dụng') || lowerMsg.includes('net-30') || lowerMsg.includes('thanh toán')) {
          aiResponseText = `Chính sách tín dụng Net-30 của Red Apron cho phép doanh nghiệp của quý khách mua sắm trả sau trong vòng 30 ngày. Hạn mức mặc định là 1.000.000.000 ₫ và có thể nâng hạn mức bằng Thư tín dụng L/C ngân hàng.`;
        }
      }

      // Append AI Response to database
      await pool.request()
        .input('RFQID', sql.BigInt, rfqId)
        .input('SenderName', sql.NVarChar, 'AI Sommelier Assistant (Groq Llama-3.3)')
        .input('SenderRole', sql.NVarChar, 'AI_ASSISTANT')
        .input('MessageText', sql.NVarChar, aiResponseText.trim())
        .query(`
          INSERT INTO RFQMessages (RFQID, SenderName, SenderRole, MessageText, CreatedAt)
          VALUES (@RFQID, @SenderName, @SenderRole, @MessageText, GETDATE())
        `);
    }

    // Retrieve full updated history to return
    const result = await pool.request()
      .input('RFQID', sql.BigInt, rfqId)
      .query('SELECT * FROM RFQMessages WHERE RFQID = @RFQID ORDER BY CreatedAt ASC');

    const updatedMessages = result.recordset.map(row => ({
      message_id: row.MessageID,
      rfq_id: row.RFQID,
      sender_name: row.SenderName,
      sender_role: row.SenderRole,
      message_text: row.MessageText,
      created_at: row.CreatedAt ? row.CreatedAt.toISOString().replace('T', ' ').slice(0, 16) : null
    }));

    res.json({ success: true, data: updatedMessages });
  } catch (err) {
    console.error('Error processing message:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi gửi tin nhắn' });
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
  queryGroqAI
};
