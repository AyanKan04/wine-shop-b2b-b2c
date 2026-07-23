# RuuBusiness - Tài liệu Dự án Wine Shop B2B & B2C

## 📌 Tổng quan Thư mục Tài liệu (`docs/`)

Thư mục này chứa toàn bộ thông tin tài liệu kỹ thuật, sơ đồ hệ thống, quy trình nghiệp vụ và hướng dẫn API cho dự án Thương mại điện tử B2B/B2C Rượu & Đồ uống cao cấp (**RuuBusiness / Wine Shop**).

---

## 📁 Cấu trúc Thư mục

```text
docs/
│
├── api/
│   └── api_documentation.md    # Tài liệu chi tiết toàn bộ RESTful API Endpoints (Auth, Products, RFQ, Orders, Finance, Inventory)
│
├── diagrams/                   # Sơ đồ Kiến trúc & Luồng nghiệp vụ
│   ├── erd_diagram.png         # Sơ đồ Thực thể Liên kết (Entity Relationship Diagram)
│   ├── b2b_rfq_flowchart.png   # Sơ đồ Luồng Đàm phán Báo giá RFQ ➔ Order
│   └── license_verification.png# Sơ đồ Luồng Phê duyệt Giấy phép Bán buôn Rượu
│
├── report/                     # Báo cáo Đồ án & Tài liệu Thuyết minh
│
└── meeting-notes/              # Biên bản Họp Team & Sprint Backlog
```

---

## 🚀 Lộ trình Triển khai Kỹ thuật (Engineering Roadmap)

### **Giai đoạn 1: Chuẩn hóa Tài liệu & Quản lý API Specs** (Đã hoàn thành)
- Hoàn thiện `docs/README.md` và `docs/api/api_documentation.md`.
- Định nghĩa đầy đủ Request/Response schemas cho 100% API endpoints.

### **Giai đoạn 2: Refactor Cấu trúc Backend MVC & PostgreSQL Connection**
- Chuyển đổi `backend/src/server.js` sang mô hình MVC: `routes/`, `controllers/`, `services/`, `config/`.
- Kết nối PostgreSQL pool dựa trên `backend/database/schema.sql`.

### **Giai đoạn 3: Xác thực JWT & Phân quyền RBAC**
- Tích hợp `bcryptjs` hash mật khẩu và `jsonwebtoken` bảo vệ API.
- Middleware kiểm tra 6 nhóm vai trò (`PLATFORM_ADMIN`, `COMPANY_ADMIN`, `BUYER_REP`, `SALES_REP`, `FINANCE_OFFICER`, `WAREHOUSE_STAFF`).

### **Giai đoạn 4: Nghiệp vụ B2B & Tuân thủ Pháp lý Rượu**
- Phê duyệt Giấy phép Bán buôn/Bán lẻ rượu & kiểm tra hạn hiệu lực.
- Khép kín luồng RFQ ➔ Quotation ➔ Auto-Order ➔ Trừ kho.
- Khóa thanh toán tín dụng Net-30 khi vượt hạn mức hoặc quá hạn hóa đơn.

### **Giai đoạn 5: Chuẩn hóa Frontend Layer & State Management**
- Xây dựng `frontend/src/services/api.js` với Axios Interceptors.
- Modal xác minh tuổi $\ge 18$ và tối ưu UI B2B/B2C.

---

## 👥 Quy tắc Cập nhật Tài liệu

1. **Tính nhất quán**: Mọi thay đổi về API endpoint hoặc bảng cơ sở dữ liệu phải được cập nhật ngay vào `docs/api/api_documentation.md`.
2. **Quy tắc đặt tên file**:
   - Dạng markdown API: `api_documentation.md`, `auth_spec.md`
   - Sơ đồ: `[domain]_[type]_[version].png` (Ví dụ: `rfq_flowchart_v1.png`)
