const bcrypt = require('bcryptjs');

async function seedIfEmpty(sql, force = false) {
  try {
    if (!force) {
      // 1. Check if Companies table is empty or if we had a partial seed
      const checkCompanies = await sql.query`SELECT COUNT(*) as count FROM Companies`;
      
      // Check Orders to see if we completed seeding previously
      let ordersCount = 0;
      try {
        const checkOrders = await sql.query`SELECT COUNT(*) as count FROM Orders`;
        ordersCount = checkOrders.recordset[0].count;
      } catch (err) {
        console.warn('Orders table not checked:', err.message);
      }
      
      if (checkCompanies.recordset[0].count > 0 && ordersCount > 0) {
        console.log('SQL Server database already has data. Skipping seeder.');
        return;
      }
    }

    console.log('SQL Server database seeding initiated. Cleaning tables for a fresh seed...');

    try {
      // Clean tables in reverse dependency order to prevent foreign key errors
      await sql.query`
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContractPrices]') AND type in (N'U'))
          DELETE FROM ContractPrices;
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contracts]') AND type in (N'U'))
          DELETE FROM Contracts;
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CustomerPrices]') AND type in (N'U'))
          DELETE FROM CustomerPrices;
        
        DELETE FROM Shipments;
        DELETE FROM Payments;
        DELETE FROM Invoices;
        DELETE FROM OrderItems;
        DELETE FROM Orders;
        DELETE FROM QuotationItems;
        DELETE FROM Quotations;
        DELETE FROM RFQItems;
        DELETE FROM RFQs;
        DELETE FROM Inventories;
        DELETE FROM ProductTierPrices;
        DELETE FROM Products;
        DELETE FROM CompanyLicenses;
        DELETE FROM CreditLimits;
        DELETE FROM Users;
        DELETE FROM Companies;
        
        IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LCDocuments]') AND type in (N'U'))
        BEGIN
          DELETE FROM LCDocuments;
        END
      `;
      console.log('Database tables cleared for fresh seed.');
    } catch (cleanErr) {
      console.warn('Could not clean tables (ignoring):', cleanErr.message);
    }

    // Hash default password
    const passwordHash = bcrypt.hashSync('Password123!', 10);

    // 1. Companies
    await sql.query`
      SET IDENTITY_INSERT Companies ON;
      INSERT INTO Companies (CompanyID, CompanyCode, CompanyName, TaxCode, CompanyType, Status, Website, CreatedAt, UpdatedAt)
      VALUES 
      (1, 'COMP-LOTTE', N'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', '0301234567', 'BUYER', 'ACTIVE', 'lottesaigon.com', GETDATE(), GETDATE()),
      (2, 'COMP-REDAPRON', N'MAISON DE L''ALCOOL RED APRON FACTORY', '0109876543', 'SELLER', 'ACTIVE', 'redapron.vn', GETDATE(), GETDATE()),
      (3, 'COMP-CONTINENTAL', N'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL', '0309999111', 'BUYER', 'ACTIVE', 'continental.vn', GETDATE(), GETDATE()),
      (4, 'COMP-FURAMA', N'CÔNG TY CP KHÁCH SẠN FURAMA ĐÀ NẴNG', '0400123456', 'BUYER', 'ACTIVE', 'furamadanang.com', GETDATE(), GETDATE()),
      (5, 'COMP-SAIGONCOOP', N'LIÊN HIỆP HTX THƯƠNG MẠI TP.HCM - SAIGON CO.OP', '0300888999', 'BUYER', 'ACTIVE', 'saigoncoop.vn', GETDATE(), GETDATE()),
      (6, 'COMP-DALATWINE', N'NHÀ MÁY VANG ĐÀ LẠT - DALAT WINE JSC', '5800111222', 'SELLER', 'ACTIVE', 'dalatwine.vn', GETDATE(), GETDATE());
      SET IDENTITY_INSERT Companies OFF;
    `;

    // 2. Users
    await sql.query`
      SET IDENTITY_INSERT Users ON;
      INSERT INTO Users (UserID, CompanyID, Email, Username, PasswordHash, FirstName, LastName, UserType, Status, CreatedAt, UpdatedAt)
      VALUES
      (1, 1, 'buyer@lottesaigon.com', 'lotte_buyer', ${passwordHash}, N'Nguyễn', N'Mua Hàng', 'BUYER_REP', 'ACTIVE', GETDATE(), GETDATE()),
      (2, 2, 'admin@redapron.vn', 'admin_user', ${passwordHash}, N'Trần', N'Quản Trị', 'PLATFORM_ADMIN', 'ACTIVE', GETDATE(), GETDATE()),
      (3, 3, 'purchasing@continental.vn', 'continental_buyer', ${passwordHash}, N'Lê', N'Hải', 'BUYER_REP', 'ACTIVE', GETDATE(), GETDATE()),
      (4, 4, 'buying@furamadanang.com', 'furama_buyer', ${passwordHash}, N'Phạm', N'Phương', 'BUYER_REP', 'ACTIVE', GETDATE(), GETDATE()),
      (5, 5, 'procurement@saigoncoop.vn', 'coop_buyer', ${passwordHash}, N'Vũ Thị', N'Thảo', 'BUYER_REP', 'ACTIVE', GETDATE(), GETDATE()),
      (6, 6, 'sales@dalatwine.vn', 'dalat_seller', ${passwordHash}, N'Hoàng', N'Nam', 'SALES_REP', 'ACTIVE', GETDATE(), GETDATE()),
      (7, 2, 'warehouse@redapron.vn', 'warehouse_user', ${passwordHash}, N'Đặng', N'Kho', 'WAREHOUSE_STAFF', 'ACTIVE', GETDATE(), GETDATE()),
      (8, 2, 'finance@redapron.vn', 'finance_user', ${passwordHash}, N'Lý', N'Kế Toán', 'FINANCE_OFFICER', 'ACTIVE', GETDATE(), GETDATE()),
      (9, 1, 'admin@lottesaigon.com', 'lotte_admin', ${passwordHash}, N'Võ', N'Quản Lý', 'COMPANY_ADMIN', 'ACTIVE', GETDATE(), GETDATE());
      SET IDENTITY_INSERT Users OFF;
    `;

    // 3. CompanyLicenses
    await sql.query`
      SET IDENTITY_INSERT CompanyLicenses ON;
      INSERT INTO CompanyLicenses (LicenseID, CompanyID, LicenseType, LicenseNumber, IssueDate, ExpiryDate, DocumentUrl, Status)
      VALUES
      (1, 1, N'Giấy phép Bán buôn & Phân phối Rượu', '108/GP-BCT', '2022-03-14', '2027-03-14', '/uploads/license_lotte_saigon.pdf', 'VERIFIED'),
      (2, 3, N'Giấy phép Bán buôn Rượu', '245/GP-SCT', '2024-05-10', '2026-11-10', '/uploads/license_continental.pdf', 'PENDING_VERIFICATION'),
      (3, 4, N'Giấy phép Kinh doanh Rượu tiêu dùng tại chỗ', '789/GP-SCT', '2023-08-15', '2028-08-15', '/uploads/license_furama.pdf', 'VERIFIED'),
      (4, 5, N'Giấy phép Phân phối Rượu bán buôn toàn quốc', '312/GP-BCT', '2021-01-20', '2026-01-20', '/uploads/license_saigoncoop.pdf', 'VERIFIED');
      SET IDENTITY_INSERT CompanyLicenses OFF;
    `;

    // 4. Products
    await sql.query`
      SET IDENTITY_INSERT Products ON;
      INSERT INTO Products (ProductID, SellerCompanyID, SKU, ProductName, Slug, Description, CountryOfOrigin, AlcoholContent, VolumeML, MOQ, Status, ImageURL, CreatedAt, UpdatedAt)
      VALUES
      (101, 2, 'SKU-SCOT-MAC18', N'Macallan 18 Year Old Sherry Oak Single Malt', 'macallan-18-single-malt', N'Dòng Single Malt Whisky danh tiếng từ vùng Highland Scotland, ủ 18 năm trong thùng gỗ sồi Sherry Oak Tây Ban Nha.', N'Scotland', 43.0, 700, 5, 'ACTIVE', '/assets/images/macallen.png', GETDATE(), GETDATE()),
      (102, 2, 'SKU-FR-MARGAUX2018', N'Château Margaux Premier Grand Cru Classé 2018', 'chateau-margaux-2018', N'Vang đỏ huyền thoại thuộc bảng xếp hạng Premier Grand Cru Classé 1855 trứ danh vùng Margaux Bordeaux.', N'France', 13.5, 750, 10, 'ACTIVE', '/assets/images/margaux.png', GETDATE(), GETDATE()),
      (103, 2, 'SKU-FR-DOM2012', N'Dom Pérignon Vintage Brut Champagne 2012', 'dom-perignon-2012', N'Tuyệt phẩm Sâm-panh Pháp niên hiệu 2012 đạt sự cân bằng tuyệt hảo giữa hương hoa quả nhiệt đới và khoáng chất.', N'France', 12.5, 750, 8, 'ACTIVE', '/assets/images/dom.png', GETDATE(), GETDATE()),
      (104, 2, 'SKU-FR-HENNESSY-XO', N'Hennessy X.O Cognac Extra Old Edition', 'hennessy-xo-cognac', N'Dòng Cognac X.O trứ danh nguyên bản từ năm 1870, phối trộn hơn 100 loại eaux-de-vie lâu năm.', N'France', 40.0, 700, 6, 'ACTIVE', 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (105, 2, 'SKU-JAP-YAM12', N'Yamazaki 12 Year Old Single Malt Japanese Whisky', 'yamazaki-12-single-malt', N'Dòng Single Malt Whisky trứ danh của Nhật Bản từ nhà chưng cất Yamazaki, ủ trong thùng gỗ sồi Mizunara độc đáo.', N'Japan', 43.0, 700, 3, 'ACTIVE', 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (106, 2, 'SKU-AUS-PENGR17', N'Penfolds Grange Bin 95 Shiraz 2017', 'penfolds-grange-2017', N'Biểu tượng vang Úc cao cấp bậc nhất, phối trộn Shiraz thượng hạng từ vùng Barossa Valley danh giá.', N'Australia', 14.5, 750, 6, 'ACTIVE', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (107, 2, 'SKU-JAP-DAS23', N'Sake Dassai 23 Hayata Premium', 'sake-dassai-23', N'Dòng rượu Sake Nhật Bản siêu cao cấp với tỷ lệ mài gạo tinh xảo chỉ còn 23% phôi gạo nguyên chất.', N'Japan', 16.0, 720, 12, 'ACTIVE', 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (108, 6, 'SKU-VN-DALATPREM', N'Vang Đà Lạt Premium Cabernet Sauvignon', 'vang-da-lat-premium', N'Dòng vang đỏ chất lượng cao của Việt Nam, lên men từ những trái nho Cabernet Sauvignon tuyển chọn tại Lâm Đồng.', N'Vietnam', 12.0, 750, 24, 'ACTIVE', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (109, 2, 'SKU-SA-GRANG15', N'Grangehurst Cabernet Sauvignon 2015', 'grangehurst-cabernet-2015', N'Vang đỏ Nam Phi cổ điển từ vùng Stellenbosch, có cấu trúc đậm đà với hương vị quả chín mọng và tannin mượt mà.', N'South Africa', 14.0, 750, 12, 'ACTIVE', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (110, 2, 'SKU-FR-LAFITE16', N'Château Lafite Rothschild Pauillac 2016', 'chateau-lafite-rothschild-2016', N'Kiệt tác vang Pháp thuộc phân hạng Premier Grand Cru Classé, niên vụ 2016 được đánh giá hoàn hảo 100 điểm.', N'France', 13.0, 750, 6, 'ACTIVE', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE());
      SET IDENTITY_INSERT Products OFF;
    `;

    // 5. ProductTierPrices
    await sql.query`
      SET IDENTITY_INSERT ProductTierPrices ON;
      INSERT INTO ProductTierPrices (TierPriceID, ProductID, TierLevel, MinQuantity, PricePerUnit)
      VALUES
      (1, 101, 1, 5, 85000000), (2, 101, 2, 20, 78000000), (3, 101, 3, 50, 72500000), (4, 101, 4, 100, 68000000), (5, 101, 5, 200, 64000000),
      (6, 102, 1, 10, 120000000), (7, 102, 2, 30, 110000000), (8, 102, 3, 100, 98000000), (9, 102, 4, 250, 92000000), (10, 102, 5, 500, 85000000),
      (11, 103, 1, 8, 45000000), (12, 103, 2, 25, 41000000), (13, 103, 3, 75, 37500000), (14, 103, 4, 150, 34000000), (15, 103, 5, 300, 31000000),
      (16, 104, 1, 6, 65000000), (17, 104, 2, 20, 60000000), (18, 104, 3, 50, 54000000), (19, 104, 4, 100, 50000000), (20, 104, 5, 200, 46000000),
      (21, 105, 1, 3, 6500000), (22, 105, 2, 10, 6100000), (23, 105, 3, 30, 5800000), (24, 105, 4, 50, 5500000), (25, 105, 5, 100, 5200000),
      (26, 106, 1, 6, 22000000), (27, 106, 2, 15, 20500000), (28, 106, 3, 40, 19000000), (29, 106, 4, 80, 18000000), (30, 106, 5, 150, 17000000),
      (31, 107, 1, 12, 3200000), (32, 107, 2, 36, 3000000), (33, 107, 3, 72, 2800000), (34, 107, 4, 120, 2650000), (35, 107, 5, 240, 2500000),
      (36, 108, 1, 24, 250000), (37, 108, 2, 72, 230000), (38, 108, 3, 144, 210000), (39, 108, 4, 288, 195000), (40, 108, 5, 576, 180000),
      (41, 109, 1, 12, 850000), (42, 109, 2, 36, 780000), (43, 109, 3, 72, 720000), (44, 109, 4, 144, 670000), (45, 109, 5, 288, 620000),
      (46, 110, 1, 6, 32000000), (47, 110, 2, 15, 30000000), (48, 110, 3, 40, 28000000), (49, 110, 4, 80, 26000000), (50, 110, 5, 150, 24000000);
      SET IDENTITY_INSERT ProductTierPrices OFF;
    `;

    // 6. Inventories
    await sql.query`
      SET IDENTITY_INSERT Inventories ON;
      INSERT INTO Inventories (InventoryID, ProductID, QuantityOnHand, ReservedQuantity)
      VALUES
      (1, 101, 450, 150),
      (2, 102, 280, 50),
      (3, 103, 600, 80),
      (4, 104, 320, 40),
      (5, 105, 150, 20),
      (6, 106, 80, 10),
      (7, 107, 300, 50),
      (8, 108, 2000, 100),
      (9, 109, 500, 30),
      (10, 110, 60, 5);
      SET IDENTITY_INSERT Inventories OFF;
    `;

    // 7. CreditLimits
    await sql.query`
      SET IDENTITY_INSERT CreditLimits ON;
      INSERT INTO CreditLimits (CreditLimitID, CompanyID, CreditLimitAmount, UsedAmount)
      VALUES
      (1, 1, 1000000000, 350000000),
      (2, 3, 500000000, 0),
      (3, 4, 2000000000, 450000000),
      (4, 5, 5000000000, 0);
      SET IDENTITY_INSERT CreditLimits OFF;
    `;

    // 8. Orders
    await sql.query`
      SET IDENTITY_INSERT Orders ON;
      INSERT INTO Orders (OrderID, BuyerCompanyID, SellerCompanyID, OrderNumber, OrderStatus, PaymentMethod, TotalAmount, CreatedBy, CreatedAt)
      VALUES
      (501, 1, 2, 'ORD-2026-8821', 'DELIVERED', 'NET_30_CREDIT', 200000000, 1, '2026-08-01 10:00:00'),
      (502, 1, 2, 'ORD-2026-8842', 'SHIPPING', 'NET_30_CREDIT', 150000000, 1, '2026-08-02 11:30:00'),
      (503, 4, 2, 'ORD-2026-3021', 'DELIVERED', 'NET_30_CREDIT', 450000000, 4, '2026-03-10 09:15:00'),
      (504, 1, 2, 'ORD-2026-4102', 'DELIVERED', 'NET_30_CREDIT', 600000000, 1, '2026-04-15 14:00:00'),
      (505, 3, 2, 'ORD-2026-5291', 'DELIVERED', 'BANK_TRANSFER', 180000000, 3, '2026-05-20 15:45:00'),
      (506, 4, 2, 'ORD-2026-6184', 'DELIVERED', 'NET_30_CREDIT', 820000000, 4, '2026-06-18 10:30:00'),
      (507, 5, 2, 'ORD-2026-7299', 'DELIVERED', 'BANK_TRANSFER', 1200000000, 5, '2026-07-02 16:20:00');
      SET IDENTITY_INSERT Orders OFF;
    `;

    // 9. OrderItems
    await sql.query`
      INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice)
      VALUES
      (501, 101, 2, 100000000),
      (502, 104, 2, 75000000),
      (503, 103, 10, 45000000),
      (504, 102, 5, 120000000),
      (505, 105, 20, 9000000),
      (506, 106, 41, 20000000),
      (507, 110, 40, 30000000);
    `;

    // 10. Invoices
    await sql.query`
      SET IDENTITY_INSERT Invoices ON;
      INSERT INTO Invoices (InvoiceID, OrderID, InvoiceNumber, InvoiceDate, DueDate, Status, Amount)
      VALUES
      (91, 501, 'INV-2026-0091', '2026-08-01', '2026-09-01', 'PAID', 200000000),
      (104, 502, 'INV-2026-0104', '2026-08-02', '2026-09-02', 'UNPAID', 150000000),
      (105, 503, 'INV-2026-0105', '2026-03-10', '2026-04-10', 'PAID', 450000000),
      (106, 504, 'INV-2026-0106', '2026-04-15', '2026-05-15', 'PAID', 600000000),
      (107, 505, 'INV-2026-0107', '2026-05-20', '2026-06-20', 'PAID', 180000000),
      (108, 506, 'INV-2026-0108', '2026-06-18', '2026-07-18', 'PAID', 820000000),
      (109, 507, 'INV-2026-0109', '2026-07-02', '2026-08-02', 'PAID', 1200000000);
      SET IDENTITY_INSERT Invoices OFF;
    `;

    // 11. Payments
    await sql.query`
      INSERT INTO Payments (InvoiceID, Amount, PaymentMethod, PaymentStatus, PaidAt)
      VALUES
      (91, 200000000, 'NET_30_CREDIT', 'COMPLETED', '2026-08-05'),
      (105, 450000000, 'NET_30_CREDIT', 'COMPLETED', '2026-03-15'),
      (106, 600000000, 'NET_30_CREDIT', 'COMPLETED', '2026-04-20'),
      (107, 180000000, 'BANK_TRANSFER', 'COMPLETED', '2026-05-22'),
      (108, 820000000, 'NET_30_CREDIT', 'COMPLETED', '2026-06-25'),
      (109, 1200000000, 'BANK_TRANSFER', 'COMPLETED', '2026-07-05');
    `;

    // 12. Shipments
    await sql.query`
      SET IDENTITY_INSERT Shipments ON;
      INSERT INTO Shipments (ShipmentID, OrderID, TrackingNumber, ShipmentStatus, EstimatedDeliveryDate, DeliveryNoteUrl)
      VALUES
      (1, 501, 'VN-SHIP-20260801-001', 'DELIVERED', '2026-08-03', '/uploads/delivery_note_501.pdf'),
      (2, 502, 'VN-SHIP-20260802-002', 'IN_TRANSIT', '2026-08-05', NULL),
      (3, 503, 'VN-SHIP-20260310-003', 'DELIVERED', '2026-03-12', '/uploads/delivery_note_503.pdf'),
      (4, 504, 'VN-SHIP-20260415-004', 'DELIVERED', '2026-04-17', '/uploads/delivery_note_504.pdf'),
      (5, 505, 'VN-SHIP-20260520-005', 'DELIVERED', '2026-05-22', '/uploads/delivery_note_505.pdf'),
      (6, 506, 'VN-SHIP-20260618-006', 'DELIVERED', '2026-06-20', '/uploads/delivery_note_506.pdf'),
      (7, 507, 'VN-SHIP-20260702-007', 'DELIVERED', '2026-07-04', '/uploads/delivery_note_507.pdf');
      SET IDENTITY_INSERT Shipments OFF;
    `;

    // 13. RFQs
    await sql.query`
      SET IDENTITY_INSERT RFQs ON;
      INSERT INTO RFQs (RFQID, BuyerCompanyID, CreatedBy, Title, Description, Status, CreatedAt, ProductID, RequestedQuantity, TargetPrice, DeliveryDate)
      VALUES
      (8842, 1, 1, N'Đơn đàm phán rượu Macallan 18 sự kiện Tết 2027', N'Macallan 18 Year Old Sherry Oak Single Malt', 'SUBMITTED', GETDATE(), 101, 100, 80000000, '2026-12-31'),
      (8843, 4, 4, N'Yêu cầu báo giá vang Château Margaux số lượng lớn', N'Mua sỉ phục vụ chuỗi nhà hàng nghỉ dưỡng Furama', 'SUBMITTED', GETDATE(), 102, 50, 110000000, '2026-12-31');
      SET IDENTITY_INSERT RFQs OFF;
    `;

    // 14. RFQItems
    await sql.query`
      INSERT INTO RFQItems (RFQID, ProductID, Quantity)
      VALUES
      (8842, 101, 100),
      (8843, 102, 50);
    `;

    // 15. Quotations
    await sql.query`
      SET IDENTITY_INSERT Quotations ON;
      INSERT INTO Quotations (QuotationID, RFQID, BuyerCompanyID, SellerCompanyID, CreatedBy, Status, ValidUntil, CreatedAt)
      VALUES
      (9910, 8842, 1, 2, 1, 'PENDING', '2026-09-20', GETDATE()),
      (9911, 8843, 4, 2, 2, 'PENDING', '2026-09-25', GETDATE());
      SET IDENTITY_INSERT Quotations OFF;
    `;

    // 16. QuotationItems
    await sql.query`
      INSERT INTO QuotationItems (QuotationID, ProductID, Quantity, OfferUnitPrice)
      VALUES
      (9910, 101, 100, 70000000),
      (9911, 102, 50, 95000000);
    `;

    // 17. Seed LCDocuments if table exists
    try {
      await sql.query`
        INSERT INTO LCDocuments (BuyerCompany, LCNumber, IssuingBank, Amount, ExpiryDate, DocumentUrl, Status, CreatedAt)
        VALUES 
        (N'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', 'LC-HSBC-2026-0001', N'HSBC Việt Nam', 1500000000, '2026-12-31', '/uploads/lc_lotte_hsbc.pdf', 'VERIFIED', GETDATE()),
        (N'CÔNG TY CP KHÁCH SẠN FURAMA ĐÀ NẴNG', 'LC-VIETIN-2026-0002', N'VietinBank Đà Nẵng', 2500000000, '2026-12-31', '/uploads/lc_furama.pdf', 'PENDING', GETDATE());
      `;
    } catch (lcErr) {
      console.warn('Could not seed LCDocuments (table might not exist yet):', lcErr.message);
    }

    // 18. CustomerPrices if table exists
    try {
      await sql.query`
        INSERT INTO CustomerPrices (ProductID, BuyerCompanyID, PricePerUnit)
        VALUES
        (101, 1, 82000000),
        (102, 4, 115000000);
      `;
    } catch (custPricesErr) {
      console.warn('Could not seed CustomerPrices:', custPricesErr.message);
    }

    // 19. Contracts if table exists
    try {
      await sql.query`
        SET IDENTITY_INSERT Contracts ON;
        INSERT INTO Contracts (ContractID, BuyerCompanyID, SellerCompanyID, ContractNumber, StartDate, EndDate, Status, CreatedAt)
        VALUES
        (1, 1, 2, 'CONT-LOTTE-RED-2026', '2026-01-01', '2026-12-31', 'ACTIVE', GETDATE()),
        (2, 4, 2, 'CONT-FURAMA-RED-2026', '2026-03-01', '2027-03-01', 'ACTIVE', GETDATE());
        SET IDENTITY_INSERT Contracts OFF;
      `;
    } catch (contractsErr) {
      console.warn('Could not seed Contracts:', contractsErr.message);
    }

    // 20. ContractPrices if table exists
    try {
      await sql.query`
        INSERT INTO ContractPrices (ContractID, ProductID, ContractPrice)
        VALUES
        (1, 101, 80000000),
        (1, 102, 110000000),
        (2, 105, 6000000),
        (2, 106, 19500000);
      `;
    } catch (contractPricesErr) {
      console.warn('Could not seed ContractPrices:', contractPricesErr.message);
    }

    console.log('Seeder completed successfully!');
  } catch (err) {
    console.error('Error seeding SQL Server database:', err.message);
  }
}

module.exports = { seedIfEmpty };
