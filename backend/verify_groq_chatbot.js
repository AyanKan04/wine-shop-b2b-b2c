// Auto-test script to verify Groq Cloud AI Integration (Llama-3.3-70b-versatile)
require('dotenv').config();
const { getPool } = require('./src/config/db');
const { queryGroqAI } = require('./src/controllers/chatController');

async function runGroqVerification() {
  console.log('===========================================================');
  console.log('🤖 RUNNING AUTOMATED VERIFICATION: GROQ CLOUD AI INTEGRATION');
  console.log('===========================================================');

  const apiKey = process.env.GROQ_API_KEY;
  console.log(`🔑 GROQ API Key Loaded: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING!'}`);

  if (!apiKey) {
    console.error('❌ FAIL: GROQ_API_KEY is not configured in backend/.env!');
    process.exit(1);
  }

  try {
    const startTime = Date.now();
    const pool = await getPool();

    // Fetch catalog
    const prodRes = await pool.request().query('SELECT TOP 3 ProductID, SKU, ProductName FROM Products');
    const productCatalog = prodRes.recordset;

    console.log(`📦 Catalog Loaded: ${productCatalog.length} products from MS SQL Server.`);

    const userPrompt = 'Tư vấn cho tôi các loại rượu mạnh và rượu vang cao cấp kèm mức giá sỉ ưu đãi.';
    console.log(`💬 User Prompt: "${userPrompt}"`);

    // Call Groq AI
    const aiResult = await queryGroqAI(userPrompt, productCatalog);
    const duration = Date.now() - startTime;

    console.log(`\n-----------------------------------------------------------`);
    console.log(`⏱️ Groq AI Response Time: ${duration} ms (${(duration / 1000).toFixed(2)} s)`);
    console.log(`-----------------------------------------------------------`);
    console.log(`🤖 Groq AI Sommelier Output:\n${aiResult}`);
    console.log(`-----------------------------------------------------------`);

    if (aiResult && aiResult.length > 50) {
      console.log('\n===========================================================');
      console.log('🎉 GROQ CLOUD AI AUTOMATED VERIFICATION PASSED 100%!');
      console.log('===========================================================');
      process.exit(0);
    } else {
      console.error('❌ FAIL: Groq AI returned empty or invalid response');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ EXCEPTION IN GROQ VERIFICATION:', err);
    process.exit(1);
  }
}

runGroqVerification();
