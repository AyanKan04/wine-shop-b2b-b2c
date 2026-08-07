# ECOMMERCE_SYSTEM_AUDIT

## 1. Executive Summary

- Kiến trúc hệ thống: Node.js (Express) + MS SQL Server (msnodesqlv8) Backend & React Frontend.
- Phạm vi audit: Workflow mua hàng (RFQ -> Order -> Payment -> Fulfillment), Quản lý Sản phẩm (Pricing), Phân quyền, Data Integrity.
- Tổng số issue phát hiện: 4
- Critical: 2 (Double Payment, Duplicate Order Creation)
- High: 2 (Product IDOR, Inventory Restoration)
- Số issue đã sửa: 4
- Đánh giá mức độ sẵn sàng: Các lỗ hổng chết người liên quan tới tiền bạc và hàng hóa đã được xử lý. Có thể tiến hành Manual Verification cho các luồng đã sửa để chuẩn bị Production.

## 2. Architecture Overview

```
React (Frontend)
↓
Express REST API (auth, product, rfq, finance, warehouse)
↓
Business Logic Controllers
↓
`mssql` Driver (Transaction boundaries)
↓
SQL Server Database
```

## 3. E-commerce Workflow Map

```
Quản Trị Viên (Admin) -> Thiết lập Catalog & Pricing (Tier/Contract)
↓
Người Mua B2B (Buyer) -> RFQ (Yêu cầu báo giá)
↓
Người Bán (Seller) -> Quotation (Phát hành báo giá)
↓
Người Mua B2B -> Chấp nhận báo giá -> Tự động sinh Order + Reserve Inventory + Ghi nhận Nợ (Invoice)
↓
Kho Bãi -> Vận chuyển (Giao Hàng/Hủy) -> Giảm Tồn Kho thực tế / Phục hồi tồn kho
↓
Kế Toán -> Ghi nhận thanh toán (Payment) -> Khôi phục Hạn mức Tín dụng
```

## 4. Findings

| ID | Severity | Domain | Issue | Root Cause | Impact | Files | Status |
| -- | -------- | ------ | ----- | ---------- | ------ | ----- | ------ |
| 01 | Critical | Payment | Double Payment Exploitation | Read-Modify-Write trên Invoice.PaidAmount không atomic | KH trả 1 lần nhưng khôi phục Credit Limit 2 lần | `financeController.js` | Fixed |
| 02 | Critical | RFQ | Duplicate Order Creation | Race condition khi cập nhật Quotation Status = 'ACCEPTED' | Sinh 2 Đơn hàng, trừ Hạn mức tín dụng x2 | `rfqController.js` | Fixed |
| 03 | High | Product | IDOR trong Update/Delete/Pricing | Không check quyền sở hữu (SellerCompanyID) | Company A có thể đổi giá/xóa sản phẩm của Company B | `productController.js` | Fixed |
| 04 | High | Inventory | Không phục hồi Tồn kho khi Hủy Đơn | Missing logic cho nhánh `status === 'CANCELLED'` | Kho bị giam hàng, gây thất thoát ảo | `warehouseController.js` | Fixed |

## 5. Critical Business Logic Review

- **Pricing**: Hệ thống không có endpoint tự do cho phép Client thao tác Giá. Workflow RFQ kiểm soát rất chặt OfferUnitPrice. (Pass)
- **Inventory**: Cập nhật tồn kho (Reserve/Deduct) đã sử dụng Atomic SQL (`SET QuantityOnHand = QuantityOnHand - @Qty`). Các lỗ hổng đã được vá triệt để. (Pass)
- **Payment**: Các lỗ hổng Double Payment đã được khắc phục thông qua Optimistic Concurrency check.

## 6. Concurrency Review

- Race condition khi thanh toán: Đã fix bằng Atomic Update.
- Race condition tạo đơn hàng (Double Accept): Đã fix bằng Optimistic Concurrency Update.

## 7. Security Review

- **Auth/RBAC**: Cấu trúc role-based ổn (Sử dụng JWT middleware check theo UserType). Các lỗ hổng IDOR trên API sửa/xóa/đổi giá Sản phẩm đã được fix bằng cách chèn thêm điều kiện `SellerCompanyID`.

## 8. Database Integrity Review

- Transaction đã được implement tương đối tốt ở hầu hết các controller qua `sql.Transaction(pool)`.
- Data types phù hợp (Sử dụng `DECIMAL(18,2)` thay cho float).

## 9. Frontend / Backend Contract Review

| Feature | Frontend | Backend | Status | Problem |
| ------- | -------- | ------- | ------ | ------- |
| Thanh Toán | Gửi số tiền muốn trả | Tính toán Remaining Unpaid | Pass | Backend không tin số tiền của Client nếu > Dư nợ |

## 10. Files Changed

| File | Change | Reason | Related issue |
| ---- | ------ | ------ | ------------- |
| `financeController.js` | Cập nhật `UPDATE Invoices` sang Atomic | Chặn Double Payment | 01 |
| `rfqController.js` | Update `Quotations` kèm mệnh đề WHERE | Chặn Duplicate Order | 02 |
| `productController.js` | Thêm `AND SellerCompanyID = @CompanyID` | Ngăn IDOR khi sửa/xóa | 03 |
| `warehouseController.js` | Xử lý khôi phục `ReservedQuantity` | Chặn kẹt tồn kho ảo | 04 |

## 11. Database Changes

(Không thay đổi Data Schema hay Migration nào trong đợt này. Lỗi thuần túy thuộc về Backend Logic).

## 12. Issues Not Fixed

Không có issue nào trong diện Critical/High bị bỏ sót.

---

# Manual Verification Checklist

[ ] TEST-01 Phát hành Quotation, Mở 2 tabs và bấm Chấp nhận báo giá cùng 1 lúc (Chỉ được phép 1 tab báo thành công)
[ ] TEST-02 Mở 2 tabs để Thanh toán cùng 1 Hóa đơn với tổng dư nợ (Chỉ được phép 1 tab báo thành công)
[ ] TEST-03 Thanh toán Hóa đơn với số tiền > Dư nợ còn lại (Phải báo lỗi)
[ ] TEST-04 Tài khoản Company Admin của Lotte (CompanyID=1) thử gọi API Delete Sản phẩm của Red Apron (CompanyID=2) (Phải báo lỗi 403)
[ ] TEST-05 Hủy (CANCEL) 1 chuyến giao hàng -> Kiểm tra lại Tồn Kho (Phải khôi phục ReservedQuantity về lại như cũ)
