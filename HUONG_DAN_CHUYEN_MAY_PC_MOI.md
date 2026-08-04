# 🚀 HƯỚNG DẪN KHỞI CHẠY DỰ ÁN KHI CHUYỂN SANG MÁY TÍNH / PC MỚI

Tài liệu này hướng dẫn chi tiết từng bước để bạn tải và khởi chạy toàn bộ hệ thống Web B2B/B2C Wine Shop khi chuyển sang **Máy tính (PC/Laptop) mới** một cách mượt mà và thành công 100%.

---

## 📌 BƯỚC 1: TẢI CODE TỪ GITHUB VỀ MÁY MỚI

Mở **Terminal / Command Prompt (CMD)** tại thư mục muốn lưu dự án trên máy mới và chạy lệnh:

```bash
git clone -b feature/realtime-dashboard-and-e2e https://github.com/AyanKan04/wine-shop-b2b-b2c.git
cd wine-shop-b2b-b2c
```

*(Hoặc truy cập trực tiếp link GitHub: https://github.com/AyanKan04/wine-shop-b2b-b2c/tree/feature/realtime-dashboard-and-e2e và bấm **Code -> Download ZIP** rồi giải nén trên máy mới).*

---

## 📌 BƯỚC 2: CẤU HÌNH FILE `.env` TRONG THƯ MỤC BACKEND

1. Mở file `backend/.env` (nếu chưa có thì tạo file `.env` trong thư mục `backend/`).
2. Sửa lại các thông số kết nối **MS SQL Server** theo cấu hình của máy mới:

```env
PORT=5000
NODE_ENV=development

# CẤU HÌNH MS SQL SERVER TRÊN MÁY MỚI
DB_SERVER=LOCALHOST
DB_NAME=B2B_Alcohol_Ecommerce
DB_USER=sa
DB_PASSWORD=mật_khẩu_sql_server_máy_mới

JWT_SECRET=your_jwt_secret_key_2026_redapron
```

> **Lưu ý tên DB_SERVER:**
> - Nếu dùng SQL Server mặc định: `DB_SERVER=LOCALHOST` hoặc `DB_SERVER=127.0.0.1`
> - Nếu dùng SQL Express: `DB_SERVER=LOCALHOST\SQLEXPRESS` hoặc `DB_SERVER=TÊN_MÁY_TÍNH\SQLEXPRESS`

---

## 📌 BƯỚC 3: CÀI ĐẶT DEPENDENCIES & TẠO CSDL TỰ ĐỘNG (BACKEND)

Mở Terminal tại thư mục `backend` và chạy các lệnh sau:

```bash
# 1. Cài đặt các thư viện cần thiết
npm install

# 2. Khởi chạy server Backend (Backend sẽ TỰ ĐỘNG kiểm tra & tạo tất cả các bảng DB)
npm run dev
```

> ⚡ **Cập nhật dữ liệu thật vào Database (Chỉ chạy 1 lần duy nhất trên máy mới):**
Mở một cửa sổ Terminal khác tại thư mục `backend` và chạy lệnh seeder:
```bash
node seed_real_invoices.js
```

---

## 📌 BƯỚC 4: KHỞI CHẠY GIAO DIỆN FRONTEND (REACT)

Mở một cửa sổ Terminal riêng tại thư mục `frontend` và chạy:

```bash
# 1. Cài đặt các thư viện Frontend
npm install

# 2. Khởi chạy Web Frontend
npm run dev
```

---

## 🌐 ĐỊA CHỈ TRUY CẬP HỆ THỐNG TRÊN MÁY MỚI

Mở trình duyệt web bất kỳ (Chrome, Edge, Brave...) và truy cập:

- 💻 **Đường dẫn Web Application:** **[http://localhost:3000](http://localhost:3000)**
- ⚙️ **API Backend Server:** **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM

- **Tài khoản Admin / Sales Rep:**
  - Tên đăng nhập: `admin_user`
  - Mật khẩu: `Password123!`

- **Tài khoản Khách hàng Doanh nghiệp B2B:**
  - Tên đăng nhập: `buyer_user`
  - Mật khẩu: `Password123!`

---
*Chúc bạn thực hiện chuyển máy thành công mượt mà! 🎉*
