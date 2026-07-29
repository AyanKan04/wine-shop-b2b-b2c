# RuuBusiness API Documentation

Tài liệu quản lý RESTful API chính thức cho Hệ thống Thương mại điện tử B2B/B2C Rượu & Đồ uống cao cấp (**RuuBusiness**).

---

## 🌐 1. Thông tin Chung (General Information)

- **Base URL:** `http://localhost:5000/api`
- **Content-Type:** `application/json`
- **Authentication Scheme:** `Bearer <JWT_TOKEN>` (Gửi kèm trong Header `Authorization`)

### Định dạng Response Chuẩn (Standard Response Envelope)

#### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Mô tả kết quả thành công (nếu có)",
  "count": 10,
  "data": { ... }
}
```

#### Error Response (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`)
```json
{
  "success": false,
  "message": "Thông báo lỗi chi tiết cho client",
  "errors": [
    { "field": "tax_code", "message": "Mã số thuế không đúng định dạng 10 chữ số" }
  ]
}
```

---

## 🔐 2. Module 1: Xác thực & Người dùng (Authentication & User Management)

### 2.1. Đăng ký Tài khoản & Doanh nghiệp
- **Endpoint:** `POST /api/auth/register`
- **Mô tả:** Đăng ký tài khoản người dùng đại diện doanh nghiệp.
- **Request Body:**
```json
{
  "email": "purchasing@lottesaigon.com",
  "username": "lotte_buyer",
  "password": "Password123!",
  "company_name": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
  "tax_code": "0301234567",
  "company_type": "BUYER"
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công!",
  "data": {
    "user_id": 1,
    "email": "purchasing@lottesaigon.com",
    "company_id": 1,
    "user_type": "BUYER_REP"
  }
}
```

---

### 2.2. Đăng nhập Hệ thống (Login)
- **Endpoint:** `POST /api/auth/login`
- **Mô tả:** Đăng nhập cấp Token JWT cho người dùng.
- **Request Body:**
```json
{
  "username": "lotte_buyer",
  "password": "Password123!"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "username": "lotte_buyer",
    "email": "purchasing@lottesaigon.com",
    "user_type": "BUYER_REP",
    "company_name": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON"
  }
}
```

---

### 2.3. Lấy thông tin Tài khoản hiện tại
- **Endpoint:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "lotte_buyer",
    "user_type": "BUYER_REP",
    "company": {
      "company_id": 1,
      "company_name": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
      "tax_code": "0301234567",
      "status": "ACTIVE"
    }
  }
}
```

---

## 🏛 3. Module 2: Quản lý Doanh nghiệp & Giấy phép Rượu (Company & Alcohol Licenses)

### 3.1. Nộp Hồ sơ Doanh nghiệp & Giấy phép Rượu
- **Endpoint:** `POST /api/companies/register`
- **Mô tả:** Khai báo thông tin pháp lý doanh nghiệp & upload Giấy phép Bán buôn/Bán lẻ rượu.
- **Request Body:**
```json
{
  "company_name": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
  "tax_code": "0301234567",
  "license_number": "108/GP-BCT",
  "license_type": "Giấy phép Bán buôn & Phân phối Rượu",
  "issue_date": "2022-03-14",
  "expiry_date": "2027-03-14",
  "document_url": "/uploads/license_lotte_saigon.pdf"
}
```

---

### 3.2. Danh sách Giấy phép chờ Phê duyệt (Platform Admin)
- **Endpoint:** `GET /api/admin/licenses`
- **Permission Required:** `PLATFORM_ADMIN`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "license_id": 1,
      "company_id": 1,
      "company_name": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
      "license_number": "108/GP-BCT",
      "status": "VERIFIED",
      "expiry_date": "2027-03-14"
    }
  ]
}
```

---

### 3.3. Phê duyệt Giấy phép Rượu
- **Endpoint:** `POST /api/admin/licenses/:id/approve`
- **Permission Required:** `PLATFORM_ADMIN`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Đã phê duyệt Giấy phép Rượu hợp lệ!"
}
```

---

## 🍾 4. Module 3: Danh mục Sản phẩm & Bảng giá Sỉ (Products & Tier Pricing)

### 4.1. Lấy danh sách Sản phẩm (với Lọc nâng cao)
- **Endpoint:** `GET /api/products`
- **Query Parameters:**
  - `category` *(optional)*: Phân loại (`Fine Wine`, `Spirits / Whisky`, `Champagne`, `Cognac`)
  - `country` *(optional)*: Quốc gia (`France`, `Scotland`, `Italy`, `Chile`)
  - `grape` *(optional)*: Giống nho (`Cabernet Sauvignon`, `Merlot`, `Malted Barley`)
  - `search` *(optional)*: Từ khóa tìm kiếm SKU hoặc tên sản phẩm
- **Response (`200 OK`):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "product_id": 101,
      "sku": "SKU-SCOT-MAC18",
      "product_name": "Macallan 18 Year Old Sherry Oak Single Malt",
      "category": "Spirits / Whisky",
      "country_of_origin": "Scotland",
      "vintage_year": 2018,
      "alcohol_content": 43.0,
      "volume_ml": 700,
      "moq": 5,
      "image_url": "https://images.unsplash.com/photo-1527281400683-1aae777175f8",
      "tier_prices": [
        { "tier_level": 1, "min_quantity": 5, "price_per_unit": 85000000 },
        { "tier_level": 2, "min_quantity": 20, "price_per_unit": 78000000 },
        { "tier_level": 3, "min_quantity": 50, "price_per_unit": 72500000 }
      ]
    }
  ]
}
```

---

### 4.2. Chi tiết Sản phẩm & Bảng giá 5 Tiers
- **Endpoint:** `GET /api/products/:id`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "product_id": 101,
    "sku": "SKU-SCOT-MAC18",
    "product_name": "Macallan 18 Year Old Sherry Oak Single Malt",
    "description": "Dòng Single Malt Whisky danh tiếng từ vùng Highland Scotland...",
    "tier_prices": [
      { "tier_level": 1, "min_quantity": 5, "price_per_unit": 85000000 },
      { "tier_level": 2, "min_quantity": 20, "price_per_unit": 78000000 },
      { "tier_level": 3, "min_quantity": 50, "price_per_unit": 72500000 },
      { "tier_level": 4, "min_quantity": 100, "price_per_unit": 68000000 },
      { "tier_level": 5, "min_quantity": 200, "price_per_unit": 64000000 }
    ]
  }
}
```

---

## 📝 5. Module 4: Đàm phán RFQ & Báo giá Quotation (RFQ & Quotations)

### 5.1. Tạo Yêu cầu Báo giá RFQ (Buyer)
- **Endpoint:** `POST /api/rfqs`
- **Request Body:**
```json
{
  "product_name": "Macallan 18 Year Old Sherry Oak Single Malt",
  "quantity": 150,
  "target_price": 68000000
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Tạo Yêu cầu Báo giá RFQ thành công!",
  "rfq": {
    "rfq_id": 8843,
    "buyer_company": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
    "product_name": "Macallan 18 Year Old Sherry Oak Single Malt",
    "quantity": 150,
    "status": "SUBMITTED"
  }
}
```

---

### 5.2. Phát hành Bảng Báo Giá Quotation (Seller)
- **Endpoint:** `POST /api/sales/quotations`
- **Request Body:**
```json
{
  "rfq_id": 8843,
  "offer_unit_price": 68500000,
  "quantity": 150
}
```

---

## 💳 6. Module 5: Đơn hàng & Tín dụng Tài chính Net-30 (Orders & Finance)

### 6.1. Lấy thông tin Hạn mức Tín dụng & Hóa đơn
- **Endpoint:** `GET /api/finance/credit-limit`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "credit": {
    "total_limit": 1000000000,
    "used_amount": 350000000,
    "available_balance": 650000000
  },
  "invoices": [
    {
      "invoice_id": 104,
      "invoice_number": "INV-2026-0104",
      "due_date": "2026-08-20",
      "amount": 150000000,
      "status": "UNPAID"
    }
  ]
}
```

---

### 6.2. Thanh toán Hóa đơn khôi phục Hạn mức Tín dụng
- **Endpoint:** `POST /api/finance/pay-invoice/:id`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Thanh toán hóa đơn thành công! Hạn mức khả dụng đã được khôi phục."
}
```

---

## 📦 7. Module 6: Kho hàng & Vận chuyển (Warehouse Inventory)

### 7.1. Truy vấn Tồn kho
- **Endpoint:** `GET /api/warehouse/inventory`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "inventory": [
    {
      "product_id": 101,
      "sku": "SKU-SCOT-MAC18",
      "product_name": "Macallan 18 Year Old Sherry Oak Single Malt",
      "stock_on_hand": 450,
      "reserved": 150,
      "available": 300,
      "min_stock_level": 50,
      "location": "Kho A1 - Quận 7",
      "stock_status": "OK"
    }
  ]
}
```

---

### 7.2. Điều chỉnh Tồn kho (Nhập/Xuất kho)
- **Endpoint:** `POST /api/warehouse/inventory/adjust`
- **Request Body:**
```json
{
  "product_id": 101,
  "adjustment_type": "IMPORT", // 'IMPORT' hoặc 'EXPORT'
  "quantity": 50,
  "reason": "Lô hàng nhập khẩu mới từ Scotland"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Đã nhập kho thêm 50 thùng cho SKU-SCOT-MAC18. Tồn kho mới: 500",
  "inventory_item": {
    "product_id": 101,
    "sku": "SKU-SCOT-MAC18",
    "stock_on_hand": 500,
    "reserved": 150
  }
}
```

---

### 7.3. Truy vấn Danh sách Phiếu giao hàng (Shipments)
- **Endpoint:** `GET /api/warehouse/shipments`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "shipment_id": 1,
      "order_number": "ORD-2026-8821",
      "buyer_company": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
      "tracking_number": "VN-SHIP-20260728-001",
      "carrier": "Giao Hàng Nhanh (GHN)",
      "shipment_status": "DELIVERED",
      "items_summary": "Macallan 18 x 20 thùng"
    }
  ]
}
```

---

### 7.4. Tạo Phiếu giao hàng Mới
- **Endpoint:** `POST /api/warehouse/shipments`
- **Request Body:**
```json
{
  "order_number": "ORD-2026-8842",
  "buyer_company": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
  "carrier": "Viettel Post",
  "items_summary": "Dom Pérignon 2012 x 8 thùng"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Đã tạo phiếu xuất kho/vận chuyển mới!",
  "shipment": {
    "shipment_id": 2,
    "tracking_number": "VN-SHIP-20260729-002",
    "shipment_status": "PICKING",
    "carrier": "Viettel Post"
  }
}
```

---

### 7.5. Cập nhật Trạng thái Vận chuyển
- **Endpoint:** `PUT /api/warehouse/shipments/:id/status`
- **Request Body:**
```json
{
  "status": "IN_TRANSIT" // 'PICKING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Trạng thái vận đơn đã được chuyển sang: IN_TRANSIT",
  "shipment": {
    "shipment_id": 1,
    "shipment_status": "IN_TRANSIT"
  }
}
```

---

## 📈 8. Module 7: Quản trị Giá sỉ & CRUD Sản phẩm (Products & Catalog Management)

### 8.1. Thêm Sản phẩm & Thiết lập 5 Bậc Giá Sỉ
- **Endpoint:** `POST /api/products`
- **Request Body:**
```json
{
  "product_name": "Vang Montes Alpha Cabernet Sauvignon",
  "sku": "SKU-CL-MONTES2021",
  "category": "Fine Wine",
  "country_of_origin": "Chile",
  "vintage_year": 2021,
  "alcohol_content": 14.5,
  "volume_ml": 750,
  "moq": 6,
  "tier_prices": [
    { "tier_level": 1, "min_quantity": 6, "price_per_unit": 50000000 },
    { "tier_level": 2, "min_quantity": 20, "price_per_unit": 45000000 },
    { "tier_level": 3, "min_quantity": 50, "price_per_unit": 40000000 },
    { "tier_level": 4, "min_quantity": 100, "price_per_unit": 36000000 },
    { "tier_level": 5, "min_quantity": 200, "price_per_unit": 32000000 }
  ]
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Đã thêm sản phẩm \"Vang Montes Alpha Cabernet Sauvignon\" thành công!",
  "data": {
    "product_id": 105,
    "sku": "SKU-CL-MONTES2021"
  }
}
```

---

### 8.2. Cập nhật Sản phẩm
- **Endpoint:** `PUT /api/products/:id`
- **Request Body:**
```json
{
  "alcohol_content": 14.2
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Cập nhật sản phẩm thành công",
  "data": {
    "product_id": 101,
    "alcohol_content": 14.2
  }
}
```

---

### 8.3. Xóa Sản phẩm
- **Endpoint:** `DELETE /api/products/:id`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Đã xóa sản phẩm thành công"
}
```

---

## 💬 9. Module 8: Đàm phán Giá & Chấp nhận Báo giá B2B Order Flow

### 9.1. Phê duyệt/Chấp nhận Báo giá (Accept/Reject Quotation)
- **Endpoint:** `PUT /api/sales/quotations/:id/status`
- **Request Body:**
```json
{
  "status": "ACCEPTED" // 'ACCEPTED' hoặc 'REJECTED'
}
```
- **Mô tả:** Khi Buyer bấm chấp nhận báo giá, hệ thống sẽ tự động chuyển đổi thành Đơn hàng B2B chính thức, phát hành hóa đơn trả sau Net-30, tự động trừ hạn mức tín dụng còn lại của doanh nghiệp.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái báo giá sang: ACCEPTED",
  "quotation": {
    "quotation_id": 9910,
    "status": "ACCEPTED"
  },
  "credit": {
    "total_limit": 1000000000,
    "used_amount": 10200000000, // Đã cộng dồn tiền đơn hàng mới
    "available_balance": -9200000000
  }
}
```

---

## 📊 10. Module 9: Analytics Dashboard & Hoạt động Hệ thống

### 10.1. Thống kê KPI Nền tảng
- **Endpoint:** `GET /api/dashboard/stats`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "stats": {
    "total_revenue": 18650000000,
    "orders_count": 30,
    "b2b_partners_count": 4,
    "inventory_total_cases": 1650
  }
}
```

---

### 10.2. Nhật ký Hoạt động (Activity Logs Feed)
- **Endpoint:** `GET /api/dashboard/activity`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ACT-1",
      "timestamp": "2026-07-28 20:25",
      "module": "CRM",
      "action": "Chuyển DEAL-101 sang Đang Đàm Phán",
      "actor": "Sales Admin",
      "icon": "fa-square-kanban",
      "color": "#F59E0B"
    }
  ]
}
```

---

### 10.3. Chuông Báo động Hệ thống (Notifications)
- **Endpoint:** `GET /api/dashboard/notifications`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "NOTIF-001",
      "type": "warning",
      "title": "Hóa đơn sắp đến hạn",
      "message": "INV-2026-0104 đến hạn ngày 20/08/2026 (còn 23 ngày)",
      "read": false,
      "timestamp": "20:00"
    }
  ]
}
```

---

## 🏛 11. Module 10: Thư tín dụng Bảo lãnh L/C (Bank Letter of Credit Documents)

### 11.1. Lấy danh sách tài liệu L/C đã nộp
- **Endpoint:** `GET /api/finance/lc-documents`
- **Mô tả:** Lấy danh sách hồ sơ Thư tín dụng bảo lãnh L/C của doanh nghiệp.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "lc_id": 1,
      "buyer_company": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
      "lc_number": "LC-2026-0001",
      "issuing_bank": "Vietcombank",
      "amount": 2000000000,
      "expiry_date": "2027-07-30",
      "document_url": "/uploads/lc_lotte_saigon.pdf",
      "status": "SUBMITTED",
      "created_at": "2026-07-29"
    }
  ]
}
```

---

### 11.2. Nộp tài liệu L/C mới để xin nâng hạn mức
- **Endpoint:** `POST /api/finance/lc-documents`
- **Request Body:**
```json
{
  "lc_number": "LC-2026-0002",
  "issuing_bank": "Techcombank",
  "amount": 1500000000,
  "expiry_date": "2027-12-31",
  "document_url": "/uploads/lc_techcombank_signed.pdf"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Đăng ký L/C thành công! Đang chờ Kế toán trưởng thẩm định.",
  "data": {
    "lc_id": 2,
    "buyer_company": "CÔNG TY CP KHÁCH SẠN LOTTE SAIGON",
    "lc_number": "LC-2026-0002",
    "issuing_bank": "Techcombank",
    "amount": 1500000000,
    "expiry_date": "2027-12-31",
    "document_url": "/uploads/lc_techcombank_signed.pdf",
    "status": "SUBMITTED",
    "created_at": "2026-07-29"
  }
}
```

---

### 11.3. Phê duyệt Thư tín dụng L/C (Kế Toán Trưởng)
- **Endpoint:** `POST /api/finance/lc-documents/:id/verify`
- **Mô tả:** Phê duyệt Thư tín dụng hợp lệ, tăng hạn mức tín dụng Net-30 và số dư khả dụng tương ứng.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Phê duyệt L/C thành công! Hạn mức tín dụng của doanh nghiệp đã được nâng cao.",
  "data": {
    "lc_id": 1,
    "status": "VERIFIED"
  }
}
```

---

### 11.4. Từ chối Thư tín dụng L/C (Kế Toán Trưởng)
- **Endpoint:** `POST /api/finance/lc-documents/:id/reject`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Đã từ chối tài liệu L/C bảo lãnh thành công.",
  "data": {
    "lc_id": 1,
    "status": "REJECTED"
  }
}
```

---

## 🔄 12. Quy trình Nghiệp vụ Hệ thống B2B (End-to-End B2B Workflow)

Hệ thống **RuuBusiness B2B** vận hành theo một chuỗi quy trình khép kín, tối ưu hóa giao dịch bán buôn rượu nhập khẩu chính ngạch:

### Bước 1: Đăng ký & Thẩm định Pháp lý (Onboarding & Compliance)
1. Đại diện mua hàng (`BUYER_REP`) đăng ký tài khoản qua Form Đăng ký B2B, cung cấp ĐKKD & Giấy phép bán lẻ rượu (Nghị định 105/2017/NĐ-CP).
2. Quản trị viên (`PLATFORM_ADMIN`) thẩm định hồ sơ qua Admin Dashboard, phê duyệt hoặc từ chối trạng thái hoạt động của tài khoản.

### Bước 2: Duyệt Hạn Mức Tín Dụng ban đầu (Initial Credit Limit)
1. Sau khi giấy phép rượu được duyệt, bộ phận Tài chính cấp hạn mức mua hàng trả sau Net-30 ban đầu (ví dụ: 1 Tỷ VNĐ) cho doanh nghiệp.

### Bước 3: Thương lượng & Đàm phán RFQ sỉ (B2B RFQ Negotiation & AI Sommelier)
1. Buyer xem danh mục giá sỉ 5 tầng (Tier Pricing) dựa trên số lượng mua.
2. Nếu muốn thỏa thuận giá tốt hơn hoặc đặt số lượng lớn vượt khung, Buyer tạo yêu cầu báo giá (RFQ).
3. Đội ngũ Kinh doanh (`SALES_REP`) và Buyer thảo luận qua ô chat thời gian thực. Sommelier AI hỗ trợ cung cấp tư vấn chuyên sâu về niên vụ, nồng độ ABV, MOQ và đề xuất báo giá sỉ tối ưu.

### Bước 4: Chốt Đơn & Tự động giảm hạn mức tín dụng (Order Flow & Credit Control)
1. Sales phát hành báo giá chính thức (`Quotation`).
2. Buyer bấm Chấp nhận báo giá (`ACCEPTED`) $\rightarrow$ Hệ thống tự động tạo Đơn hàng chính thức, phát hành Hóa đơn trả sau Net-30, và tự động trừ giá trị đơn hàng vào Hạn mức khả dụng (`available_balance`).
3. Nếu Dư nợ vượt quá hạn mức hoặc có hóa đơn quá hạn 30 ngày, hệ thống tự động khóa thanh toán Net-30, chuyển Buyer sang hình thức Trả trước (Pre-payment).

### Bước 5: Bảo lãnh Thư tín dụng L/C để gia tăng hạn mức (Letter of Credit)
1. Để tăng hạn mức mua nợ trả sau Net-30 cho các đơn hàng lớn tiếp theo, Buyer nộp bản bảo lãnh Thư tín dụng Ngân hàng (L/C).
2. Kế toán trưởng (`FINANCE_OFFICER`) duyệt L/C $\rightarrow$ Tổng hạn mức (`total_limit`) và Số dư khả dụng của Buyer lập tức được cộng thêm giá trị của Thư tín dụng L/C.

### Bước 6: Quản lý Kho & Vận chuyển (Warehouse & Logistics)
1. Đơn hàng được chuyển thông tin sang kho. Thủ kho (`WAREHOUSE_STAFF`) kiểm kho, đóng gói, xuất kho (`EXPORT`) và tạo vận đơn vận chuyển (`Shipments`).
2. Trạng thái vận đơn được cập nhật liên tục từ `PICKING` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED`.


