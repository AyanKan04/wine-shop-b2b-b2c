const { getPool } = require('./src/config/db');
const sql = require('mssql/msnodesqlv8');

const API_URL = 'http://localhost:5000/api';

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_URL}${endpoint}`, options);
  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`API Error [${method} ${endpoint}]: Returned non-JSON response (Status ${res.status})`);
  }
  if (!data.success) throw new Error(`API Error [${method} ${endpoint}]: ` + JSON.stringify(data));
  return data;
}

async function runComprehensiveTest() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU AUTO TEST TOÀN DIỆN TẤT CẢ ROLE NGƯỜI DÙNG & REAL DB');
  console.log('================================================================\n');

  const pool = await getPool();
  const testResults = [];

  function recordResult(role, feature, webEndpoint, dbTable, dbQueryKey, dbValue, status = 'SUCCESS') {
    testResults.push({
      role,
      feature,
      webEndpoint,
      dbTable,
      dbQueryKey,
      dbValue,
      status
    });
    console.log(`✅ [${role}] ${feature}`);
    console.log(`   └─ Web API: ${webEndpoint}`);
    console.log(`   └─ SQL DB: Table [${dbTable}] -> ${dbQueryKey} = ${dbValue}\n`);
  }

  const ts = Date.now();

  try {
    // -------------------------------------------------------------
    // ROLE 1: PLATFORM_ADMIN (MASTER ADMIN)
    // -------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('🔑 1. KIỂM THỬ ROLE: PLATFORM_ADMIN (MASTER ADMIN)');
    console.log('----------------------------------------------------------------');

    // 1.1 Master Admin Login
    const adminLogin = await fetchAPI('/auth/login', 'POST', { username: 'admin_user', password: 'Password123!' });
    const adminToken = adminLogin.token;

    // Verify Admin in DB
    const adminDb = await pool.request()
      .input('Username', sql.NVarChar, 'admin_user')
      .query(`SELECT UserID, Username, UserType, Status FROM Users WHERE Username = @Username`);
    recordResult('PLATFORM_ADMIN', 'Đăng nhập Master Admin', 'POST /api/auth/login', 'Users', 'UserID', adminDb.recordset[0].UserID);

    // 1.2 Dashboard Stats & Activity
    const statsRes = await fetchAPI('/dashboard/stats', 'GET', null, adminToken);
    const totalRev = statsRes.stats ? (statsRes.stats.total_revenue || statsRes.stats.totalRevenue || 0) : 0;
    recordResult('PLATFORM_ADMIN', 'Xem Thống Kê Dashboard Realtime', 'GET /api/dashboard/stats', 'Orders/Invoices/Companies', 'TotalRevenue', `${totalRev} VNĐ`);

    // 1.3 Master Admin Thêm mới User
    const newAdminUserUsername = `admin_subuser_${ts}`;
    const newAdminUserRes = await fetchAPI('/users', 'POST', {
      username: newAdminUserUsername,
      email: `${newAdminUserUsername}@domain.com`,
      password: 'Password123!',
      first_name: 'Quản Trị',
      last_name: 'Viên Phụ',
      user_type: 'PLATFORM_ADMIN',
      phone_number: '0988777666'
    }, adminToken);
    const createdAdminUserId = newAdminUserRes.data.user_id;

    // Verify in SQL DB
    const newAdminUserDb = await pool.request()
      .input('UserID', sql.BigInt, createdAdminUserId)
      .query(`SELECT UserID, Username, UserType, Status FROM Users WHERE UserID = @UserID`);
    recordResult('PLATFORM_ADMIN', 'Tạo tài khoản Platform Admin phụ', 'POST /api/users', 'Users', 'UserID', newAdminUserDb.recordset[0].UserID);

    // Update User Info
    await fetchAPI(`/users/${createdAdminUserId}`, 'PUT', {
      first_name: 'Quản Trị Cao Cấp',
      user_type: 'PLATFORM_ADMIN',
      status: 'ACTIVE'
    }, adminToken);
    const updatedAdminUserDb = await pool.request()
      .input('UserID', sql.BigInt, createdAdminUserId)
      .query(`SELECT FirstName FROM Users WHERE UserID = @UserID`);
    recordResult('PLATFORM_ADMIN', 'Cập nhật thông tin User Admin', `PUT /api/users/${createdAdminUserId}`, 'Users', 'FirstName', `'${updatedAdminUserDb.recordset[0].FirstName}'`);


    // -------------------------------------------------------------
    // ROLE 2: BUYER_REP (ĐỐI TÁC B2B BUYER)
    // -------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('🏢 2. KIỂM THỬ ROLE: BUYER_REP (KHÁCH HÀNG ĐỐI TÁC B2B)');
    console.log('----------------------------------------------------------------');

    // 2.1 Đăng ký Khách hàng B2B mới
    const buyerUsername = `b2b_buyer_${ts}`;
    const buyerCompanyName = `TẬP ĐOÀN KHÁCH SẠN LUXURY ${ts}`;
    const regData = {
      username: buyerUsername,
      password: 'Password123!',
      email: `${buyerUsername}@luxuryhotel.com`,
      first_name: 'Nguyễn Văn',
      last_name: 'Giám Đốc Mua Hàng',
      company_name: buyerCompanyName,
      tax_code: `TAX-${ts}`,
      company_type: 'BUYER',
      license_type: 'Giấy phép Bán buôn Rượu',
      license_number: `GP-BCT-${ts}`,
      issue_date: '2024-01-01',
      expiry_date: '2029-01-01'
    };
    await fetchAPI('/auth/register', 'POST', regData);

    // Verify in SQL DB (Companies & Users)
    const buyerUserDb = await pool.request()
      .input('Username', sql.NVarChar, buyerUsername)
      .query(`
        SELECT u.UserID, u.CompanyID, c.CompanyName, cl.LicenseID, cl.Status as LicenseStatus 
        FROM Users u 
        JOIN Companies c ON u.CompanyID = c.CompanyID
        LEFT JOIN CompanyLicenses cl ON c.CompanyID = cl.CompanyID
        WHERE u.Username = @Username
      `);
    const buyerInfo = buyerUserDb.recordset[0];
    recordResult('BUYER_REP', 'Đăng ký doanh nghiệp & tài khoản B2B', 'POST /api/auth/register', 'Companies & Users', 'CompanyID / UserID', `${buyerInfo.CompanyID} / ${buyerInfo.UserID}`);

    // 2.2 Buyer Login
    const buyerLogin = await fetchAPI('/auth/login', 'POST', { username: buyerUsername, password: 'Password123!' });
    const buyerToken = buyerLogin.token;
    recordResult('BUYER_REP', 'Đăng nhập đối tác B2B', 'POST /api/auth/login', 'Users', 'UserID', buyerInfo.UserID);

    // 2.3 Master Admin duyệt giấy phép cho Buyer (nếu có)
    if (buyerInfo.LicenseID) {
      await fetchAPI(`/admin/licenses/${buyerInfo.LicenseID}/approve`, 'POST', null, adminToken);
      const approvedLicenseDb = await pool.request()
        .input('LicenseID', sql.BigInt, buyerInfo.LicenseID)
        .query(`SELECT Status FROM CompanyLicenses WHERE LicenseID = @LicenseID`);
      recordResult('PLATFORM_ADMIN', 'Duyệt giấy phép kinh doanh B2B', `POST /api/admin/licenses/${buyerInfo.LicenseID}/approve`, 'CompanyLicenses', 'Status', `'${approvedLicenseDb.recordset[0].Status}'`);
    }

    // 2.4 Buyer Tạo RFQ (Đàm phán giá)
    const productsRes = await fetchAPI('/products', 'GET', null, buyerToken);
    const prodList = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.data;
    const targetProduct = prodList.find(p => p.product_id === 101) || prodList[0];

    const rfqRes = await fetchAPI('/rfqs', 'POST', {
      product_id: targetProduct.product_id,
      title: `Đơn hàng đàm phán rượu sự kiện ${ts}`,
      requested_quantity: 120,
      target_price: 85000000,
      delivery_date: '2026-12-31',
      note: 'Yêu cầu giao tận kho khách sạn kèm CO/CQ chứng nhận xuất xứ'
    }, buyerToken);
    const createdRFQId = rfqRes.rfq.rfq_id;

    // Verify RFQ in SQL DB
    const rfqDb = await pool.request()
      .input('RFQID', sql.BigInt, createdRFQId)
      .query(`SELECT RFQID, Title, Status, BuyerCompanyID FROM RFQs WHERE RFQID = @RFQID`);
    recordResult('BUYER_REP', 'Tạo đơn đàm phán giá RFQ', 'POST /api/rfqs', 'RFQs', 'RFQID', rfqDb.recordset[0].RFQID);


    // -------------------------------------------------------------
    // ROLE 3: SELLER_REP (ĐẠI DIỆN NHÀ CUNG CẤP / ADMIN BÁN HÀNG)
    // -------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('🍷 3. KIỂM THỬ ROLE: SELLER_REP & PHẢN HỒI BÁO GIÁ');
    console.log('----------------------------------------------------------------');

    // 3.1 Seller Phản hồi Báo Giá (Quotation) cho RFQ
    const quotationRes = await fetchAPI('/sales/quotations', 'POST', {
      rfq_id: createdRFQId,
      offer_unit_price: 82000000,
      valid_until: '2026-12-31',
      terms: 'Chiết khấu 3.5% khi thanh toán bằng L/C hoặc Net-30'
    }, adminToken);
    const createdQuotationId = quotationRes.quotation.quotation_id;

    // Verify Quotation in SQL DB
    const quoteDb = await pool.request()
      .input('QuotationID', sql.BigInt, createdQuotationId)
      .query(`SELECT QuotationID, RFQID, Status FROM Quotations WHERE QuotationID = @QuotationID`);
    recordResult('SELLER_REP / ADMIN', 'Tạo Báo Giá (Quotation) cho RFQ', 'POST /api/sales/quotations', 'Quotations', 'QuotationID', quoteDb.recordset[0].QuotationID);

    // 3.2 Buyer Chấp nhận Báo giá
    await fetchAPI(`/sales/quotations/${createdQuotationId}/status`, 'PUT', { status: 'ACCEPTED' }, buyerToken);

    // Verify Orders & Invoices in SQL DB
    const orderDb = await pool.request()
      .input('BuyerCompanyID', sql.BigInt, buyerInfo.CompanyID)
      .query(`
        SELECT o.OrderID, o.OrderNumber, o.OrderStatus, o.TotalAmount, i.InvoiceID, i.InvoiceNumber, i.Status as InvoiceStatus
        FROM Orders o
        LEFT JOIN Invoices i ON o.OrderID = i.OrderID
        WHERE o.BuyerCompanyID = @BuyerCompanyID
        ORDER BY o.CreatedAt DESC
      `);
    const generatedOrder = orderDb.recordset[0];
    recordResult('BUYER_REP', 'Chấp nhận Báo giá (Sinh tự động Order & Invoice)', `PUT /api/sales/quotations/${createdQuotationId}/status`, 'Orders & Invoices', 'OrderID / InvoiceID', `${generatedOrder.OrderID} / ${generatedOrder.InvoiceID}`);


    // -------------------------------------------------------------
    // ROLE 4: FINANCE & CREDIT CONTROL (TÀI CHÍNH & THẺ TÍN DỤNG)
    // -------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('💳 4. KIỂM THỬ FINANCE: HẠN MỨC TÍN DỤNG, L/C & THANH TOÁN');
    console.log('----------------------------------------------------------------');

    // 4.1 Cấp/Cập nhật hạn mức tín dụng Net-30 cho Buyer mới
    await fetchAPI('/finance/credit-limit', 'PUT', {
      total_limit: 3000000000
    }, buyerToken);

    // Verify Credit Limit in SQL DB
    const creditDb = await pool.request()
      .input('CompanyID', sql.BigInt, buyerInfo.CompanyID)
      .query(`SELECT CreditLimitID, CompanyID, CreditLimitAmount, UsedAmount FROM CreditLimits WHERE CompanyID = @CompanyID`);
    recordResult('BUYER_REP / FINANCE', 'Cập nhật hạn mức tín dụng Net-30', 'PUT /api/finance/credit-limit', 'CreditLimits', 'CreditLimitAmount', `${creditDb.recordset[0].CreditLimitAmount} VNĐ`);

    // 4.2 Buyer Nộp Chứng từ L/C (Letter of Credit)
    const lcRes = await fetchAPI('/finance/lc-documents', 'POST', {
      buyer_company: buyerCompanyName,
      lc_number: `LC-BIDV-${ts}`,
      issuing_bank: 'Ngân hàng BIDV Chi nhánh TP.HCM',
      amount: 5000000000,
      expiry_date: '2027-06-30',
      document_url: `/uploads/lc_doc_${ts}.pdf`
    }, buyerToken);
    
    // Verify LC in SQL DB
    const lcDb = await pool.request()
      .input('LCNumber', sql.NVarChar, `LC-BIDV-${ts}`)
      .query(`SELECT LCID, LCNumber, IssuingBank, Status FROM LCDocuments WHERE LCNumber = @LCNumber`);
    const lcRecord = lcDb.recordset[0];
    recordResult('BUYER_REP', 'Nộp chứng từ L/C tín dụng thư', 'POST /api/finance/lc-documents', 'LCDocuments', 'LCID', lcRecord.LCID);

    // 4.3 Admin Xác thực duyệt L/C
    await fetchAPI(`/finance/lc-documents/${lcRecord.LCID}/verify`, 'POST', { status: 'VERIFIED' }, adminToken);
    const lcVerifiedDb = await pool.request()
      .input('LCID', sql.BigInt, lcRecord.LCID)
      .query(`SELECT Status FROM LCDocuments WHERE LCID = @LCID`);
    recordResult('PLATFORM_ADMIN', 'Phê duyệt Chứng từ L/C', `POST /api/finance/lc-documents/${lcRecord.LCID}/verify`, 'LCDocuments', 'Status', `'${lcVerifiedDb.recordset[0].Status}'`);

    // 4.4 Buyer Thanh toán Hóa đơn
    if (generatedOrder && generatedOrder.InvoiceID) {
      await fetchAPI(`/finance/pay-invoice/${generatedOrder.InvoiceID}`, 'POST', null, buyerToken);
      const paidInvoiceDb = await pool.request()
        .input('InvoiceID', sql.BigInt, generatedOrder.InvoiceID)
        .query(`SELECT Status, Amount FROM Invoices WHERE InvoiceID = @InvoiceID`);
      recordResult('BUYER_REP', 'Thanh toán Hóa đơn đơn hàng Net-30', `POST /api/finance/pay-invoice/${generatedOrder.InvoiceID}`, 'Invoices', 'Status', `'${paidInvoiceDb.recordset[0].Status}'`);
    }


    // -------------------------------------------------------------
    // ROLE 5: WAREHOUSE & LOGISTICS (KHO VẬN & VẬN CHUYỂN)
    // -------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('📦 5. KIỂM THỬ WAREHOUSE: QUẢN LÝ TỒN KHO & LÔ HÀNG');
    console.log('----------------------------------------------------------------');

    // 5.1 Điều chỉnh Nhập kho sản phẩm
    await fetchAPI('/warehouse/inventory/adjust', 'POST', {
      product_id: targetProduct.product_id,
      adjustment_type: 'IMPORT',
      quantity: 300,
      reason: `Nhập kho bổ sung lô hàng Tết ${ts}`
    }, adminToken);

    // Verify Inventory in SQL DB
    const invDb = await pool.request()
      .input('ProductID', sql.BigInt, targetProduct.product_id)
      .query(`SELECT InventoryID, QuantityOnHand, ReservedQuantity FROM Inventories WHERE ProductID = @ProductID`);
    recordResult('WAREHOUSE / ADMIN', 'Nhập kho bổ sung hàng hóa', 'POST /api/warehouse/inventory/adjust', 'Inventories', 'QuantityOnHand', invDb.recordset[0].QuantityOnHand);

    // 5.2 Tạo lô vận chuyển (Shipment)
    const shipmentRes = await fetchAPI('/warehouse/shipments', 'POST', {
      buyer_company: buyerCompanyName,
      carrier: 'Giao Hàng Nhanh (GHN Express)',
      items_summary: `${targetProduct.product_name} x 10 thùng`
    }, adminToken);
    const createdShipment = shipmentRes.shipment;

    // Verify Shipment in SQL DB
    const shipmentDb = await pool.request()
      .input('TrackingNumber', sql.NVarChar, createdShipment.tracking_number)
      .query(`SELECT ShipmentID, TrackingNumber, ShipmentStatus FROM Shipments WHERE TrackingNumber = @TrackingNumber`);
    const shipmentRow = shipmentDb.recordset[0];
    recordResult('WAREHOUSE / ADMIN', 'Tạo vận đơn giao hàng', 'POST /api/warehouse/shipments', 'Shipments', 'ShipmentID', shipmentRow.ShipmentID);

    // 5.3 Cập nhật trạng thái lô hàng -> IN_TRANSIT
    await fetchAPI(`/warehouse/shipments/${shipmentRow.ShipmentID}/status`, 'PUT', {
      status: 'IN_TRANSIT'
    }, adminToken);
    const updatedShipmentDb = await pool.request()
      .input('ShipmentID', sql.BigInt, shipmentRow.ShipmentID)
      .query(`SELECT ShipmentStatus FROM Shipments WHERE ShipmentID = @ShipmentID`);
    recordResult('WAREHOUSE / ADMIN', 'Cập nhật trạng thái vận đơn (Đang giao)', `PUT /api/warehouse/shipments/${shipmentRow.ShipmentID}/status`, 'Shipments', 'ShipmentStatus', `'${updatedShipmentDb.recordset[0].ShipmentStatus}'`);


    // -------------------------------------------------------------
    // ROLE 6: COMPANY_ADMIN (QUẢN TRỊ VIÊN DOANH NGHIỆP BUYER)
    // -------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('🏬 6. KIỂM THỬ ROLE: COMPANY_ADMIN (TẠO USER CHO CÔNG TY)');
    console.log('----------------------------------------------------------------');

    const companyAdminUsername = `company_admin_${ts}`;
    await fetchAPI('/users', 'POST', {
      username: companyAdminUsername,
      email: `${companyAdminUsername}@luxuryhotel.com`,
      password: 'Password123!',
      first_name: 'Trần Văn',
      last_name: 'Quản Lý Kho',
      user_type: 'COMPANY_ADMIN',
      company_id: buyerInfo.CompanyID
    }, adminToken);
    
    // Login as Company Admin
    const compAdminLogin = await fetchAPI('/auth/login', 'POST', { username: companyAdminUsername, password: 'Password123!' });
    const compAdminToken = compAdminLogin.token;

    // Company Admin tự tạo thêm 1 nhân viên Mua hàng thuộc cùng công ty
    const subBuyerUsername = `buyer_staff_${ts}`;
    const subBuyerRes = await fetchAPI('/users', 'POST', {
      username: subBuyerUsername,
      email: `${subBuyerUsername}@luxuryhotel.com`,
      password: 'Password123!',
      first_name: 'Lê Thị',
      last_name: 'Nhân Viên Mua Hàng',
      user_type: 'BUYER_REP'
    }, compAdminToken);

    // Verify in SQL DB
    const subUserDb = await pool.request()
      .input('UserID', sql.BigInt, subBuyerRes.data.user_id)
      .query(`SELECT UserID, Username, CompanyID, UserType FROM Users WHERE UserID = @UserID`);
    recordResult('COMPANY_ADMIN', 'Company Admin tạo nhân viên thuộc công ty', 'POST /api/users', 'Users', 'UserID', subUserDb.recordset[0].UserID);


    console.log('================================================================');
    console.log('🎉 TẤT CẢ KỊCH BẢN AUTO TEST 100% THÀNH CÔNG RỰC RỠ!');
    console.log('================================================================');

    return {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: testResults.length,
        buyerCompanyId: buyerInfo.CompanyID,
        buyerCompanyName: buyerCompanyName,
        buyerUsername: buyerUsername,
        buyerUserId: buyerInfo.UserID,
        createdAdminUserId: createdAdminUserId,
        rfqId: createdRFQId,
        quotationId: createdQuotationId,
        orderId: generatedOrder ? generatedOrder.OrderID : null,
        orderNumber: generatedOrder ? generatedOrder.OrderNumber : null,
        invoiceId: generatedOrder ? generatedOrder.InvoiceID : null,
        invoiceNumber: generatedOrder ? generatedOrder.InvoiceNumber : null,
        lcId: lcRecord.LCID,
        lcNumber: lcRecord.LCNumber,
        shipmentId: shipmentRow.ShipmentID,
        trackingNumber: shipmentRow.TrackingNumber
      },
      details: testResults
    };

  } catch (err) {
    console.error('\n❌ PHÁT HIỆN LỖI TRONG QUÁ TRÌNH KIỂM THỬ:');
    console.error(err.message);
    process.exit(1);
  }
}

runComprehensiveTest().then(report => {
  const fs = require('fs');
  fs.writeFileSync('./verify_report.json', JSON.stringify(report, null, 2));
  console.log('\n--- ĐÃ GHI KẾT QUẢ VÀO FILE verify_report.json ---');
  process.exit(0);
});
