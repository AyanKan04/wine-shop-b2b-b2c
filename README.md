# wine-shop-b2b-b2c

# Backend API Branch

## Mục đích

Branch này dùng để phát triển hệ thống backend và API cho website bán rượu B2B/B2C.

---

# Thành phần phụ trách

* REST API
* Authentication
* Authorization
* Business logic
* Xử lý dữ liệu
* Kết nối database

---

# Khu vực làm việc chính

backend/

---

# Quy tắc làm việc

* Tách route và controller riêng
* Validate dữ liệu đầu vào
* Không upload file .env
* Không sửa frontend nếu không được phân công

---

# Cấu trúc backend đề xuất

backend/
│
├── routes/
├── controllers/
├── models/
├── middlewares/
├── services/
└── config/

---

# Quy tắc đặt tên

Dùng camelCase.

Ví dụ:

* authController.js
* paymentService.js

---

# Workflow

1. Pull code mới nhất
2. Phát triển API/backend
3. Test API
4. Commit và push
5. Tạo Pull Request về main

---

# Ví dụ commit

* Create authentication API
* Add product routes
* Fix login validation
