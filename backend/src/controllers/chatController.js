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

// Helper to query Gemini API if GEMINI_API_KEY is configured in env
async function queryGeminiAI(userText, productCatalog) {
  const geminiKeys = [
    process.env.GEMINI_API_KEY_0,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY,
    process.env.AI_API_KEY
  ].filter(key => key && key !== 'YOUR_GEMINI_API_KEY_HERE');

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
${JSON.stringify(productCatalog, null, 2)}`;

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
      return resData.candidates[0].content.parts[0].text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
    }
  } catch (err) {
    console.error('Error calling Gemini AI:', err.message);
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

    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải lịch sử chat' });
  }
};

// Send a chat message with AI Sommelier trigger hook
const sendMessage = async (req, res) => {
  const rfqId = parseInt(req.params.id);
  const { sender_name, sender_role, message_text } = req.body;

  if (!message_text) {
    return res.status(400).json({ success: false, message: 'Nội dung tin nhắn là bắt buộc' });
  }

  try {
    const pool = await getPool();
    await ensureRFQMessagesTable(pool);

    // 1. Save Buyer or Sales message
    await pool.request()
      .input('RFQID', sql.BigInt, rfqId)
      .input('SenderName', sql.NVarChar, sender_name || 'Anonymous')
      .input('SenderRole', sql.NVarChar, sender_role || 'BUYER')
      .input('MessageText', sql.NVarChar, message_text.trim())
      .query(`
        INSERT INTO RFQMessages (RFQID, SenderName, SenderRole, MessageText, CreatedAt)
        VALUES (@RFQID, @SenderName, @SenderRole, @MessageText, GETDATE())
      `);

    // 2. Trigger AI Sommelier if tagged "@ai" or if message is explicitly requesting Sommelier assist
    const lowerMsg = message_text.toLowerCase();
    const needsAiResponse = lowerMsg.includes('@ai') || lowerMsg.includes('sommelier') || lowerMsg.includes('tư vấn') || lowerMsg.includes('chiết khấu');

    if (needsAiResponse) {
      let aiResponseText = null;

      if (process.env.NODE_ENV === 'test') {
        // Return mock response during testing to avoid slow/flaky real API calls
        aiResponseText = 'Trợ lý AI Sommelier: Dòng rượu Macallan 18 Year Old Sherry Oak Single Malt có MOQ tối thiểu là 5 thùng.';
      } else {
        // Fetch products to give to AI
        const prodRes = await pool.request().query(`
          SELECT p.*, 
                 (SELECT * FROM ProductTierPrices t WHERE t.ProductID = p.ProductID ORDER BY TierLevel ASC FOR JSON PATH) as tier_prices
          FROM Products p
        `);
        
        const productCatalog = prodRes.recordset;

        // 2a. Try real Gemini AI if API Key is configured
        aiResponseText = await queryGeminiAI(message_text, productCatalog);

        // 2b. Set error message if real AI model fails or is not configured
        if (!aiResponseText) {
          aiResponseText = 'Không thể kết nối với mô hình AI Sommelier thực tế. Vui lòng kiểm tra cấu hình biến môi trường GEMINI_API_KEY trong file .env.';
        }
      }

      // Append AI Response to database
      await pool.request()
        .input('RFQID', sql.BigInt, rfqId)
        .input('SenderName', sql.NVarChar, 'AI Sommelier Assistant')
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
  sendMessage
};
