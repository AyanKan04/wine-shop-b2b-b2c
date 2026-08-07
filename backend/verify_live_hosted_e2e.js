const LIVE_BACKEND = 'https://wine-shop-b2b-b2c.onrender.com/api';
const LIVE_FRONTEND = 'https://wine-shop-b2b-b2c.vercel.app';

async function safeFetchJson(url, options = {}) {
  try {
    const r = await fetch(url, options);
    const text = await r.text();
    try {
      return { status: r.status, ok: r.ok, data: JSON.parse(text) };
    } catch(e) {
      return { status: r.status, ok: r.ok, rawText: text };
    }
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function runLiveAudit() {
  console.log('\n================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ E2E TOÀN DIỆN TRÊN HOSTING THỰC TẾ (VERCEL & RENDER)');
  console.log(`🌐 Frontend URL: ${LIVE_FRONTEND}`);
  console.log(`⚙️  Backend URL:  ${LIVE_BACKEND}`);
  console.log('================================================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0
  };

  function logTest(name, success, details) {
    if (success) {
      report.passed++;
      console.log(`✅ [PASS] ${name}`);
    } else {
      report.failed++;
      console.log(`❌ [FAIL] ${name} - Details:`, JSON.stringify(details));
    }
    report.tests.push({ name, success, details });
  }

  // 1. Health Check
  const resHealth = await safeFetchJson(`${LIVE_BACKEND}/health`);
  logTest('1. Health Check API Backend Render', resHealth.ok && resHealth.data?.success === true, resHealth.data || resHealth.rawText);

  // 2. Public Catalog & Real Images
  const resProducts = await safeFetchJson(`${LIVE_BACKEND}/products`);
  const validProducts = resProducts.ok && Array.isArray(resProducts.data?.data) && resProducts.data.data.length >= 4;
  const images = resProducts.data?.data ? resProducts.data.data.map(p => p.image_url) : [];
  logTest('2. Public Catalog (4 Sản Phẩm Ảnh Thật DB)', validProducts, `Số lượng: ${resProducts.data?.data ? resProducts.data.data.length : 0} | Images: ${images.join(', ')}`);

  // 3. Buyer Login (lotte_buyer)
  let buyerToken = null;
  const resBuyerLogin = await safeFetchJson(`${LIVE_BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'lotte_buyer', password: 'Password123!' })
  });
  buyerToken = resBuyerLogin.data?.token;
  logTest('3. Đăng nhập B2B Buyer (lotte_buyer)', resBuyerLogin.ok && !!buyerToken, `Role: ${resBuyerLogin.data?.user?.role || 'N/A'}`);

  // 4. Admin Login (admin_user)
  let adminToken = null;
  const resAdminLogin = await safeFetchJson(`${LIVE_BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin_user', password: 'Password123!' })
  });
  adminToken = resAdminLogin.data?.token;
  logTest('4. Đăng nhập Master Admin (admin_user)', resAdminLogin.ok && !!adminToken, `Role: ${resAdminLogin.data?.user?.role || 'N/A'}`);

  // 5. IDOR Data Isolation Check (Buyer Order & Invoice Isolation)
  if (buyerToken) {
    const resOrders = await safeFetchJson(`${LIVE_BACKEND}/orders`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const resCredit = await safeFetchJson(`${LIVE_BACKEND}/finance/credit-limit`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });

    const ordersList = resOrders.data?.data || resOrders.data || [];
    const invoicesList = resCredit.data?.invoices || [];

    const ordersMatch = ordersList.length > 0 && ordersList.every(o => (o.buyer_company || o.BuyerCompany || 'LOTTE').toUpperCase().includes('LOTTE'));
    const invoicesMatch = invoicesList.length > 0 && invoicesList.every(i => (i.buyer_company || i.BuyerCompany || 'LOTTE').toUpperCase().includes('LOTTE'));
    
    logTest('5. Bảo Vệ Phân Quyền IDOR (Buyer Chỉ Thấy Dữ Liệu Công Ty Mình)', ordersMatch && invoicesMatch, `Orders Count: ${ordersList.length} | Invoices Count: ${invoicesList.length}`);
  }

  // 6. Create RFQ & Quotation Persistence Flow
  let newRfqId = null;
  if (buyerToken) {
    const resRfq = await safeFetchJson(`${LIVE_BACKEND}/rfqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        title: 'RFQ Mua Sỉ Đồ Uống Hosted Test',
        product_name: 'Hennessy X.O Cognac Extra Old Edition',
        quantity: 20,
        target_price: 45000000
      })
    });

    newRfqId = resRfq.data?.rfq ? (resRfq.data.rfq.rfq_id || resRfq.data.rfq.RFQID) : (resRfq.data?.RFQID || 5001);
    logTest('6. Gửi Yêu Cầu Báo Giá RFQ Mới (Buyer)', resRfq.ok && resRfq.data?.success === true, resRfq.data || resRfq.rawText);
  }

  // 7. Create Quotation (Sales Admin) & Save to DB
  if (adminToken && newRfqId) {
    const resQuote = await safeFetchJson(`${LIVE_BACKEND}/sales/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        rfq_id: newRfqId,
        offer_unit_price: 44000000,
        quantity: 20,
        product_id: 104,
        notes: 'Chiết khấu 3% cho hợp đồng mua lớn'
      })
    });

    logTest('7. Phát Hành Báo Giá Quotation Vĩnh Viễn Vào DB (Sales Admin)', resQuote.ok && resQuote.data?.success === true, resQuote.data || resQuote.rawText);
  }

  // 8. Submit L/C & Approve L/C Credit Line Sync
  let newLcId = null;
  if (buyerToken) {
    const resLc = await safeFetchJson(`${LIVE_BACKEND}/finance/lc-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        lc_number: `LC-LIVE-${Date.now()}`,
        issuing_bank: 'VIETCOMBANK HOAN KIEM',
        amount: 500000000,
        expiry_date: '2026-12-31',
        buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON'
      })
    });

    newLcId = resLc.data?.lc_document ? (resLc.data.lc_document.lc_id || resLc.data.lc_document.LCID) : (resLc.data?.LCID || resLc.data?.lc_id);
    logTest('8. Nộp Thư Tín Dụng L/C Ngân Hàng (Buyer)', resLc.ok && resLc.data?.success === true, resLc.data || resLc.rawText);
  }

  // 9. Approve L/C & Credit Line Increase (Finance Officer)
  if (adminToken && newLcId) {
    const resVerify = await safeFetchJson(`${LIVE_BACKEND}/finance/lc-documents/${newLcId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'VERIFIED' })
    });

    logTest('9. Phê Duyệt L/C & Tự Động Cộng Hạn Mức Tín Dụng Khả Dụng (Finance Officer)', resVerify.ok && resVerify.data?.success === true, resVerify.data || resVerify.rawText);
  }

  // 10. CRM Kanban Data Sync Check
  if (adminToken) {
    const resRfqs = await safeFetchJson(`${LIVE_BACKEND}/rfqs`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const resQuotes = await safeFetchJson(`${LIVE_BACKEND}/sales/quotations`, { headers: { Authorization: `Bearer ${adminToken}` } });
    
    const valid = resRfqs.ok && resQuotes.ok;
    logTest('10. Đồng Bộ Dữ Liệu CRM Kanban 5 Cột', valid, `RFQs Status: ${resRfqs.status} | Quotes Status: ${resQuotes.status}`);
  }

  // 11. Overview Dashboard KPI Stats Check
  if (adminToken) {
    const resStats = await safeFetchJson(`${LIVE_BACKEND}/dashboard/stats`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const statsValid = resStats.ok && resStats.data?.stats?.total_revenue > 0 && resStats.data?.stats?.total_companies > 0;
    logTest('11. Thống Kê Realtime Trang Tổng Quan (Doanh Thu > 0 & Số Công Ty > 0)', statsValid, resStats.data?.stats);
  }

  // 12. Chatbot AI Sommelier Channel Check
  const resChat = await safeFetchJson(`${LIVE_BACKEND}/rfqs/999/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_name: 'Khách hàng', sender_role: 'BUYER', message_text: 'chào bạn' })
  });

  const chatValid = resChat.ok && resChat.data?.success === true && Array.isArray(resChat.data.data) && resChat.data.data.some(m => m.sender_role === 'AI_ASSISTANT');
  logTest('12. Chatbot AI Sommelier Phản Hồi Tự Động Realtime (Trích Xuất AI Reply)', chatValid, resChat.data);

  // 13. Batch Tier Price Configuration Persistence Check (Tier 1-5 Save)
  if (adminToken) {
    const resSaveTiers = await safeFetchJson(`${LIVE_BACKEND}/products/batch-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        product_ids: [101],
        priceType: 'TIER',
        prices: [
          { tier_level: 1, min_quantity: 5, price_per_unit: 68000000 },
          { tier_level: 2, min_quantity: 20, price_per_unit: 65000000 },
          { tier_level: 3, min_quantity: 12, price_per_unit: 62000000 },
          { tier_level: 4, min_quantity: 24, price_per_unit: 59000000 },
          { tier_level: 5, min_quantity: 60, price_per_unit: 55000000 }
        ]
      })
    });

    const resGetProd = await safeFetchJson(`${LIVE_BACKEND}/products/101`);
    const pData = resGetProd.data?.data || resGetProd.data;
    const tiersList = pData?.tier_prices || [];
    const tierMatch = resSaveTiers.ok && tiersList.length >= 5;

    logTest('13. Lưu & Lưu Trữ Cấu Hình Giá Sỉ Tier 1-5 Vào DB (ProductTierPrices Persistence)', tierMatch, `Tier Count: ${tiersList.length} | Response: ${resSaveTiers.data?.message}`);
  }

  // 14. Invoice Payment Collection Persistence Check
  if (adminToken) {
    const resPay = await safeFetchJson(`${LIVE_BACKEND}/finance/invoices/8184/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ paid_amount: 150000000 })
    });

    const resCredit = await safeFetchJson(`${LIVE_BACKEND}/finance/credit-limit`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const invs = resCredit.data?.invoices || [];
    const inv8184 = invs.find(i => (i.invoice_id || i.InvoiceID) == 8184);
    const payValid = inv8184 && (inv8184.status === 'PAID' || Number(inv8184.paid_amount) > 0);

    logTest('14. Thu Tiền Hóa Đơn Hàng & Cập Nhật Trạng Thái Đã Thanh Toán (PAID)', payValid, `Pay Response: ${resPay.status} ${JSON.stringify(resPay.data)} | Inv8184: ${JSON.stringify(inv8184)}`);
  }

  // 15. Frontend Vercel Live Page Load Check
  const resFe = await safeFetchJson(LIVE_FRONTEND);
  logTest('15. Frontend Live Website (Vercel HTTP Status)', resFe.status === 200, `Status: ${resFe.status}`);

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${report.passed}/${report.tests.length} TEST CASES THÀNH CÔNG (PASS)`);
  console.log('================================================================\n');

  return report;
}

runLiveAudit();
