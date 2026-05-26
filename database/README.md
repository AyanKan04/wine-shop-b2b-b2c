# Database Folder

## Mục đích

Folder này chứa toàn bộ tài nguyên liên quan đến database của dự án.

Database chịu trách nhiệm:

* Thiết kế bảng dữ liệu
* Quan hệ dữ liệu
* SQL script
* Seed dữ liệu mẫu
* Backup database

---

# Công nghệ sử dụng

* SQL Server / postgresql

---

# Cấu trúc đề xuất

database/
│
├── schema/
├── seed/
├── backup/
└── diagrams/

---

# Mô tả từng folder

## schema/

Chứa script tạo bảng.

Ví dụ:

* create_users.sql
* create_products.sql

---

## seed/

Chứa dữ liệu mẫu.

Ví dụ:

* insert_products.sql

---

## backup/

Chứa file backup database.

---

## diagrams/

Chứa sơ đồ ERD hoặc quan hệ dữ liệu.

---

# Quy tắc đặt tên

## File SQL

Dùng snake_case.

Ví dụ:

* create_users_table.sql
* insert_demo_products.sql

---

# Quy tắc làm việc

* Backup trước khi sửa lớn
* Cập nhật schema đầy đủ
* Ghi chú rõ quan hệ dữ liệu
* Không xóa dữ liệu quan trọng tùy ý

---

# Thành viên phụ trách

Database developer(s).

