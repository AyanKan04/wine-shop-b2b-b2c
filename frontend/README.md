# Frontend Folder

## Mục đích

Folder này chứa toàn bộ mã nguồn phía giao diện (client-side) của website bán rượu B2B/B2C.

Frontend chịu trách nhiệm:

* Giao diện người dùng (UI)
* Trải nghiệm người dùng (UX)
* Responsive cho điện thoại/máy tính
* Tương tác người dùng
* Gọi API từ backend

---

# Công nghệ sử dụng

* HTML / CSS / JavaScript
* ReactJS
* Bootstrap

---

# Cấu trúc đề xuất

frontend/
│
├── pages/
├── components/
├── assets/
├── styles/
├── services/
└── utils/

---

# Mô tả từng folder

## pages/

Chứa các trang chính:

* Trang chủ
* Trang sản phẩm
* Giỏ hàng
* Đăng nhập
* Dashboard admin

---

## components/

Chứa các component tái sử dụng:

* Navbar
* Footer
* Product Card
* Sidebar

---

## assets/

Tài nguyên riêng của frontend:

* icon
* hình ảnh
* font

---

## styles/

Chứa CSS hoặc file style dùng chung.

---

## services/

Chứa các hàm gọi API.

Ví dụ:

* authService.js
* productService.js

---

## utils/

Các hàm hỗ trợ hoặc xử lý phụ trợ.

---

# Quy tắc đặt tên

## File JavaScript

Dùng camelCase.

Ví dụ:

* loginPage.js
* productService.js

---

## Component React

Dùng PascalCase.

Ví dụ:

* ProductCard.jsx
* AdminSidebar.jsx

---

# Quy tắc làm việc

* Không upload node_modules
* Không viết toàn bộ code trong 1 file
* Tách component hợp lý
* Không chỉnh sửa backend nếu không được phân công

---

# Thành viên phụ trách

Frontend developer(s).
