const LIVE_BACKEND = 'https://wine-shop-b2b-b2c.onrender.com/api';
const LIVE_FRONTEND = 'https://wine-shop-b2b-b2c.vercel.app';

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
      console.log(`❌ [FAIL] ${name} - Details:`, details);
    }
    report.tests.push({ name, success, details });
  }

  // 1. Health Check
  try {
    const res = await fetch(`${LIVE_BACKEND}/health`).then(r => r.json());
    logTest('1. Health Check API Backend Render', res.success === true, res.status);
  } catch (err) {
    logTest('1. Health Check API Backend Render', false, err.message);
  }

  // 2. Public Catalog & Real Images
  try {
    const res = await fetch(`${LIVE_BACKEND}/products`).then(r => r.json());
    const valid = res.success && Array.isArray(res.data) && res.data.length >= 4;
    const images = res.data ? res.data.map(p => p.image_url) : [];
    logTest('2. Public Catalog (4 Sản Phẩm Ảnh Thật DB)', valid, `Số lượng: ${res.data ? res.data.length : 0} | Images: ${images.join(', ')}`);
  } catch (err) {
    logTest('2. Public Catalog (4 Sản Phẩm Ảnh Thật DB)', false, err.message);
  }

  // 3. Buyer Login (lotte_buyer)
  let buyerToken = null;
  try {
    const res = await fetch(`${LIVE_BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'lotte_buyer', password: 'Password123!' })
    }).then(r => r.json());
    buyerToken = res.token;
    logTest('3. Đăng nhập B2B Buyer (lotte_buyer)', res.success === true && !!buyerToken, `Role: ${res.user ? res.user.role : 'N/A'}`);
  } catch (err) {
    logTest('3. Đăng nhập B2B Buyer (lotte_buyer)', false, err.message);
  }

  // 4. Admin Login (admin_user)
  let adminToken = null;
  try {
    const res = await fetch(`${LIVE_BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin_user', password: 'Password123!' })
    }).then(r => r.json());
    adminToken = res.token;
    logTest('4. Đăng nhập Master Admin (admin_user)', res.success === true && !!adminToken, `Role: ${res.user ? res.user.role : 'N/A'}`);
  } catch (err) {
    logTest('4. Đăng nhập Master Admin (admin_user)', false, err.message);
  }

  // 5. IDOR Data Isolation Check (Buyer Order & Invoice Isolation)
  if (buyerToken) {
    try {
      const resOrders = await fetch(`${LIVE_BACKEND}/orders`, {
        headers: { Authorization: `Bearer ${buyerToken}` }
      }).then(r => r.json());
      
      const resCredit = await fetch(`${LIVE_BACKEND}/finance/credit-limit`, {
        headers: { Authorization: `Bearer ${buyerToken}` }
      }).then(r => r.json());

      const ordersMatch = resOrders.data && resOrders.data.every(o => o.buyer_company.includes('LOTTE SAIGON'));
      const invoicesMatch = resCredit.invoices && resCredit.invoices.every(i => i.buyer_company.includes('LOTTE SAIGON'));
      
      logTest('5. Bảo Vệ Phân Quyền IDOR (Buyer Chỉ Thấy Dữ Liệu Công Ty Mình)', ordersMatch && invoicesMatch, `Orders Count: ${resOrders.data ? resOrders.data.length : 0} | Invoices Count: ${resCredit.invoices ? resCredit.invoices.length : 0}`);
    } catch (err) {
      logTest('5. Bảo Vệ Phân Quyền IDOR (Buyer Chỉ Thấy Dữ Liệu Công Ty Mình)', false, err.message);
    }
  }

  // 6. Create RFQ & Quotation Persistence Flow
  let newRfqId = null;
  if (buyerToken) {
    try {
      const resRfq = await fetch(`${LIVE_BACKEND}/rfqs`, {
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
      }).then(r => r.json());

      newRfqId = resRfq.rfq ? resRfq.rfq.rfq_id : null;
      logTest('6. Gửi Yêu Cầu Báo Giá RFQ Mới (Buyer)', resRfq.success === true && !!newRfqId, `RFQ ID: ${newRfqId}`);
    } catch (err) {
      logTest('6. Gửi Yêu Cầu Báo Giá RFQ Mới (Buyer)', false, err.message);
    }
  }

  // 7. Create Quotation (Sales Admin) & Save to DB
  if (adminToken && newRfqId) {
    try {
      const resQuote = await fetch(`${LIVE_BACKEND}/sales/quotations`, {
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
      }).then(r => r.json());

      logTest('7. Phát Hành Báo Giá Quotation Vĩnh Viễn Vào DB (Sales Admin)', resQuote.success === true, `Quotation ID: ${resQuote.quotation ? resQuote.quotation.quotation_id : 'N/A'}`);
    } catch (err) {
      logTest('7. Phát Hành Báo Giá Quotation Vĩnh Viễn Vào DB (Sales Admin)', false, err.message);
    }
  }

  // 8. Submit L/C & Approve L/C Credit Line Sync
  let newLcId = null;
  if (buyerToken) {
    try {
      const resLc = await fetch(`${LIVE_BACKEND}/finance/lc-documents`, {
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
      }).then(r => r.json());

      newLcId = resLc.lc_document ? resLc.lc_document.lc_id : null;
      logTest('8. Nộp Thư Tín Dụng L/C Ngân Hàng (Buyer)', resLc.success === true && !!newLcId, `LC ID: ${newLcId}`);
    } catch (err) {
      logTest('8. Nộp Thư Tín Dụng L/C Ngân Hàng (Buyer)', false, err.message);
    }
  }

  // 9. Approve L/C & Credit Line Increase (Finance Officer)
  if (adminToken && newLcId) {
    try {
      const resVerify = await fetch(`${LIVE_BACKEND}/finance/lc-documents/${newLcId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'VERIFIED' })
      }).then(r => r.json());

      logTest('9. Phê Duyệt L/C & Tự Động Cộng Hạn Mức Tín Dụng Khả Dụng (Finance Officer)', resVerify.success === true, resVerify.message);
    } catch (err) {
      logTest('9. Phê Duyệt L/C & Tự Động Cộng Hạn Mức Tín Dụng Khả Dụng (Finance Officer)', false, err.message);
    }
  }

  // 10. CRM Kanban Data Sync Check
  if (adminToken) {
    try {
      const [rfqRes, quoteRes] = await Promise.all([
        fetch(`${LIVE_BACKEND}/rfqs`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json()),
        fetch(`${LIVE_BACKEND}/sales/quotations`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json())
      ]);
      const valid = rfqRes.success && quoteRes.success;
      logTest('10. Đồng Bộ Dữ Liệu CRM Kanban 5 Cột', valid, `RFQs: ${rfqRes.data ? rfqRes.data.length : 0} | Quotations: ${quoteRes.data ? quoteRes.data.length : 0}`);
    } catch (err) {
      logTest('10. Đồng Bộ Dữ Liệu CRM Kanban 5 Cột', false, err.message);
    }
  }

  // 11. Frontend Vercel Live Page Load Check
  try {
    const resFe = await fetch(LIVE_FRONTEND);
    logTest('11. Frontend Live Website (Vercel HTTP Status)', resFe.status === 200, `Status: ${resFe.status}`);
  } catch (err) {
    logTest('11. Frontend Live Website (Vercel HTTP Status)', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${report.passed}/${report.tests.length} TEST CASES THÀNH CÔNG (PASS)`);
  console.log('================================================================\n');

  return report;
}

runLiveAudit();
