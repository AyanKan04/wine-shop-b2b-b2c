# Backend Folder

## Mục đích

Folder này chứa toàn bộ mã nguồn phía server (backend) của hệ thống website bán rượu B2B/B2C.

Backend chịu trách nhiệm:

* Xây dựng API
* Xử lý logic hệ thống
* Đăng nhập / phân quyền
* Kết nối database
* Xử lý dữ liệu

---

# Công nghệ sử dụng

* NodeJS
* ExpressJS
* REST API

---

# Cấu trúc đề xuất

backend/
│
├── routes/
├── controllers/
├── models/
├── middlewares/
├── services/
├── config/
└── server.js

---

# Mô tả từng folder

## routes/

Chứa các route API.

Ví dụ:

* authRoutes.js
* productRoutes.js

---

## controllers/

Xử lý logic request/response.

Ví dụ:

* authController.js
* cartController.js

---

## models/

Chứa model hoặc schema database.

---

## middlewares/

Chứa middleware tự tạo.

Ví dụ:

* authMiddleware.js
* errorHandler.js

---

## services/

Xử lý business logic riêng.

---

## config/

File cấu hình hệ thống.

---

# Quy tắc đặt tên

## File JS

Dùng camelCase.

Ví dụ:

* authController.js
* paymentService.js

---

# Quy tắc làm việc

* Không upload file .env
* Validate dữ liệu đầu vào
* Tách route và logic riêng
* API phải trả dữ liệu thống nhất
* Không chỉnh sửa frontend nếu không được phân công

---

# Thành viên phụ trách

Backend developer(s).

