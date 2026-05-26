# wine-shop-b2b-b2c

# Database & Authentication Branch

## Mục đích

Branch này dùng để quản lý database và hệ thống xác thực người dùng của dự án.

---

# Thành phần phụ trách

* Database schema
* Quan hệ dữ liệu
* SQL scripts
* Authentication
* User roles
* Backup database

---

# Khu vực làm việc chính

database/

---

# Quy tắc làm việc

* Backup database trước khi thay đổi lớn
* Không xóa dữ liệu quan trọng tùy ý
* Ghi chú rõ các quan hệ bảng
* Authentication phải đảm bảo bảo mật cơ bản

---

# Cấu trúc database đề xuất

database/
│
├── schema/
├── seed/
├── backup/
└── diagrams/

---

# Quy tắc đặt tên

## File SQL

Dùng snake_case.

Ví dụ:

* create_users_table.sql
* insert_demo_products.sql

---

# Workflow

1. Pull code mới nhất
2. Thiết kế/chỉnh sửa database
3. Test dữ liệu
4. Commit và push
5. Tạo Pull Request về main

---

# Ví dụ commit

* Create users table
* Add product schema
* Update authentication structure
