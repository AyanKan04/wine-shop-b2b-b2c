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
    { "product_id": 101, "sku": "SKU-SCOT-MAC18", "stock_on_hand": 450, "reserved": 150 }
  ]
}
```
