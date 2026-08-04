# Wine Shop B2B/B2C - RuuBusiness

> 📖 **[BẤM VÀO ĐÂY ĐỂ XEM HƯỚNG DẪN KHỞI CHẠY KHI CHUYỂN SANG MÁY PC MỚI](./HUONG_DAN_CHUYEN_MAY_PC_MOI.md)**

Hệ thống Thương mại Điện tử B2B & B2C phân phối sỉ rượu vang và rượu mạnh cao cấp.

---

## 1. Mục đích Dự Án
Dự án được phân chia thành các khu vực phát triển chuyên biệt trên các branch để đảm bảo tính module hóa và quản lý hiệu quả:
* **`main`**: Nhánh chính ổn định nhất, tổng hợp code từ các nhánh khác và dùng để chạy sản phẩm chính thức.
* **`backend-api`**: Phát triển REST API, xác thực, phân quyền và kết nối SQL Server Database.
* **`database-auth`**: Quản lý database schema, quan hệ dữ liệu, SQL scripts, và bảo mật xác thực.
* **`frontend-ui`**: Phát triển giao diện người dùng (ReactJS, Vite, CSS), responsive layouts, và các trang admin.
* **`feature/realtime-dashboard-and-e2e`**: Kết nối Master Admin Dashboard và toàn bộ CRM/Warehouse/Finance/Orders Workspace trực tiếp tới cơ sở dữ liệu SQL Server thời gian thực.

---

## 2. Quy Tắc Phát Triển Theo Khu Vực

### A. Frontend (Khu vực chính: `frontend/`)
* **Quy tắc đặt tên:**
  * File Javascript/CSS: Dùng `camelCase` (ví dụ: `loginPage.js`, `apiService.js`).
  * React Component: Dùng `PascalCase` (ví dụ: `ProductCard.jsx`, `AdminSidebar.jsx`).
* **Quy tắc làm việc:**
  * Giao diện cần tương thích tốt trên mobile/tablet/desktop (Responsive).
  * Viết component tách biệt, tăng khả năng tái sử dụng.
  * Chỉ chỉnh sửa mã nguồn frontend, không tự ý sửa backend nếu không có phân công.

### B. Backend (Khu vực chính: `backend/`)
* **Cấu trúc Backend:**
  * `src/routes/`: Định nghĩa định tuyến API.
  * `src/controllers/`: Xử lý business logic.
  * `src/middlewares/`: Phân quyền, xác thực và upload file.
  * `src/config/`: Kết nối cơ sở dữ liệu SQL Server.
* **Quy tắc đặt tên:**
  * File JS: Dùng `camelCase` (ví dụ: `authController.js`, `paymentService.js`).
* **Quy tắc làm việc:**
  * Tách biệt Router và Controller.
  * Xác thực thông tin đầu vào chặt chẽ trước khi xử lý DB.
  * Không upload file cấu hình nhạy cảm `.env`.

### C. Database & Auth (Khu vực chính: `backend/database/` và SQL Server)
* **Cấu trúc thư mục:**
  * `database/schema/`: Lưu trữ các file SQL khởi tạo bảng.
  * `database/seed/`: Dữ liệu mẫu ban đầu.
  * `database/diagrams/`: Biểu đồ thực thể liên kết (ERD).
* **Quy tắc đặt tên:**
  * File SQL: Dùng `snake_case` (ví dụ: `create_users_table.sql`, `insert_demo_products.sql`).
* **Quy tắc làm việc:**
  * Sao lưu cơ sở dữ liệu (Backup) trước khi thực hiện các thay đổi lớn về schema.
  * Mô tả và ghi chú rõ ràng các quan hệ khóa ngoại (Foreign Key).

---

## 3. Workflow Phát Triển
1. **Pull & Đồng Bộ:** Luôn lấy code mới nhất từ nhánh `main` trước khi làm việc.
2. **Code & Test:** Phát triển tính năng trên nhánh riêng, đảm bảo chạy thử và không có lỗi biên dịch.
3. **Commit rõ ràng:** Ví dụ:
   * `feat: Connect Master Admin Dashboard to real-time SQL DB`
   * `fix: Resolve duplicate token identifier redeclaration in useEffect hook`
4. **Push & Pull Request:** Đẩy code lên branch phụ tương ứng và tạo Pull Request (PR) về `main` để đồng nghiệp review trước khi merge.
