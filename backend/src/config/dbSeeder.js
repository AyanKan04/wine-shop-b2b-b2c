const bcrypt = require('bcryptjs');

async function seedIfEmpty(sql) {
  try {
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

    console.log('SQL Server database is empty or partially seeded. Cleaning tables for a fresh seed...');

    try {
      await sql.query`
        DELETE FROM Shipments;
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

    // Companies
    await sql.query`
      SET IDENTITY_INSERT Companies ON;
      INSERT INTO Companies (CompanyID, CompanyCode, CompanyName, TaxCode, CompanyType, Status, Website, CreatedAt, UpdatedAt)
      VALUES 
      (1, 'COMP-LOTTE', N'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', '0301234567', 'BUYER', 'ACTIVE', 'lottesaigon.com', GETDATE(), GETDATE()),
      (2, 'COMP-REDAPRON', N'MAISON DE L''ALCOOL RED APRON FACTORY', '0109876543', 'SELLER', 'ACTIVE', 'redapron.vn', GETDATE(), GETDATE()),
      (3, 'COMP-CONTINENTAL', N'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL', '0309999111', 'BUYER', 'ACTIVE', 'continental.vn', GETDATE(), GETDATE());
      SET IDENTITY_INSERT Companies OFF;
    `;

    // Users
    await sql.query`
      SET IDENTITY_INSERT Users ON;
      INSERT INTO Users (UserID, CompanyID, Email, Username, PasswordHash, FirstName, LastName, UserType, Status, CreatedAt, UpdatedAt)
      VALUES
      (1, 1, 'buyer@lottesaigon.com', 'lotte_buyer', ${passwordHash}, N'Nguyễn', N'Mua Hàng', 'BUYER_REP', 'ACTIVE', GETDATE(), GETDATE()),
      (2, 2, 'admin@redapron.vn', 'admin_user', ${passwordHash}, N'Trần', N'Quản Trị', 'PLATFORM_ADMIN', 'ACTIVE', GETDATE(), GETDATE()),
      (3, 3, 'purchasing@continental.vn', 'continental_buyer', ${passwordHash}, N'Lê', N'Hải', 'BUYER_REP', 'ACTIVE', GETDATE(), GETDATE());
      SET IDENTITY_INSERT Users OFF;
    `;

    // CompanyLicenses
    await sql.query`
      SET IDENTITY_INSERT CompanyLicenses ON;
      INSERT INTO CompanyLicenses (LicenseID, CompanyID, LicenseType, LicenseNumber, IssueDate, ExpiryDate, DocumentUrl, Status)
      VALUES
      (1, 1, N'Giấy phép Bán buôn & Phân phối Rượu', '108/GP-BCT', '2022-03-14', '2027-03-14', '/uploads/license_lotte_saigon.pdf', 'VERIFIED'),
      (2, 3, N'Giấy phép Bán buôn Rượu', '245/GP-SCT', '2024-05-10', '2026-11-10', '/uploads/license_continental.pdf', 'PENDING_VERIFICATION');
      SET IDENTITY_INSERT CompanyLicenses OFF;
    `;

    // Products
    await sql.query`
      SET IDENTITY_INSERT Products ON;
      INSERT INTO Products (ProductID, SellerCompanyID, SKU, ProductName, Slug, Description, CountryOfOrigin, AlcoholContent, VolumeML, MOQ, Status, ImageURL, CreatedAt, UpdatedAt)
      VALUES
      (101, 2, 'SKU-SCOT-MAC18', N'Macallan 18 Year Old Sherry Oak Single Malt', 'macallan-18-single-malt', N'Dòng Single Malt Whisky danh tiếng từ vùng Highland Scotland, ủ 18 năm trong thùng gỗ sồi Sherry Oak Tây Ban Nha.', N'Scotland', 43.0, 700, 5, 'ACTIVE', 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (102, 2, 'SKU-FR-MARGAUX2018', N'Château Margaux Premier Grand Cru Classé 2018', 'chateau-margaux-2018', N'Vang đỏ huyền thoại thuộc bảng xếp hạng Premier Grand Cru Classé 1855 trứ danh vùng Margaux Bordeaux.', N'France', 13.5, 750, 10, 'ACTIVE', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (103, 2, 'SKU-FR-DOM2012', N'Dom Pérignon Vintage Brut Champagne 2012', 'dom-perignon-2012', N'Tuyệt phẩm Sâm-panh Pháp niên hiệu 2012 đạt sự cân bằng tuyệt hảo giữa hương hoa quả nhiệt đới và khoáng chất.', N'France', 12.5, 750, 8, 'ACTIVE', 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE()),
      (104, 2, 'SKU-FR-HENNESSY-XO', N'Hennessy X.O Cognac Extra Old Edition', 'hennessy-xo-cognac', N'Dòng Cognac X.O trứ danh nguyên bản từ năm 1870, phối trộn hơn 100 loại eaux-de-vie lâu năm.', N'France', 40.0, 700, 6, 'ACTIVE', 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=800&q=80', GETDATE(), GETDATE());
      SET IDENTITY_INSERT Products OFF;
    `;

    // ProductTierPrices
    await sql.query`
      SET IDENTITY_INSERT ProductTierPrices ON;
      INSERT INTO ProductTierPrices (TierPriceID, ProductID, TierLevel, MinQuantity, PricePerUnit)
      VALUES
      (1, 101, 1, 5, 85000000), (2, 101, 2, 20, 78000000), (3, 101, 3, 50, 72500000), (4, 101, 4, 100, 68000000), (5, 101, 5, 200, 64000000),
      (6, 102, 1, 10, 120000000), (7, 102, 2, 30, 110000000), (8, 102, 3, 100, 98000000), (9, 102, 4, 250, 92000000), (10, 102, 5, 500, 85000000),
      (11, 103, 1, 8, 45000000), (12, 103, 2, 25, 41000000), (13, 103, 3, 75, 37500000), (14, 103, 4, 150, 34000000), (15, 103, 5, 300, 31000000),
      (16, 104, 1, 6, 65000000), (17, 104, 2, 20, 60000000), (18, 104, 3, 50, 54000000), (19, 104, 4, 100, 50000000), (20, 104, 5, 200, 46000000);
      SET IDENTITY_INSERT ProductTierPrices OFF;
    `;

    // Inventories
    await sql.query`
      SET IDENTITY_INSERT Inventories ON;
      INSERT INTO Inventories (InventoryID, ProductID, QuantityOnHand, ReservedQuantity)
      VALUES
      (1, 101, 450, 150),
      (2, 102, 280, 50),
      (3, 103, 600, 80),
      (4, 104, 320, 40);
      SET IDENTITY_INSERT Inventories OFF;
    `;

    // CreditLimits
    await sql.query`
      SET IDENTITY_INSERT CreditLimits ON;
      INSERT INTO CreditLimits (CreditLimitID, CompanyID, CreditLimitAmount, UsedAmount)
      VALUES
      (1, 1, 1000000000, 350000000),
      (2, 3, 500000000, 0);
      SET IDENTITY_INSERT CreditLimits OFF;
    `;

    // Orders
    await sql.query`
      SET IDENTITY_INSERT Orders ON;
      INSERT INTO Orders (OrderID, BuyerCompanyID, SellerCompanyID, OrderNumber, OrderStatus, PaymentMethod, TotalAmount, CreatedBy, CreatedAt)
      VALUES
      (501, 1, 2, 'ORD-2026-8821', 'DELIVERED', 'NET_30_CREDIT', 200000000, 1, GETDATE()),
      (502, 1, 2, 'ORD-2026-8842', 'SHIPPING', 'NET_30_CREDIT', 150000000, 1, GETDATE());
      SET IDENTITY_INSERT Orders OFF;
    `;

    // Invoices
    await sql.query`
      SET IDENTITY_INSERT Invoices ON;
      INSERT INTO Invoices (InvoiceID, OrderID, InvoiceNumber, InvoiceDate, DueDate, Status, Amount)
      VALUES
      (91, 501, 'INV-2026-0091', '2026-07-15', '2026-08-15', 'PAID', 200000000),
      (104, 502, 'INV-2026-0104', '2026-07-20', '2026-08-20', 'UNPAID', 150000000);
      SET IDENTITY_INSERT Invoices OFF;
    `;

    // Shipments
    await sql.query`
      SET IDENTITY_INSERT Shipments ON;
      INSERT INTO Shipments (ShipmentID, OrderID, TrackingNumber, ShipmentStatus, EstimatedDeliveryDate, DeliveryNoteUrl)
      VALUES
      (1, 501, 'VN-SHIP-20260715-001', 'DELIVERED', '2026-07-17', '/uploads/delivery_note_501.pdf'),
      (2, 502, 'VN-SHIP-20260720-002', 'IN_TRANSIT', '2026-07-23', NULL);
      SET IDENTITY_INSERT Shipments OFF;
    `;

    // RFQs
    await sql.query`
      SET IDENTITY_INSERT RFQs ON;
      INSERT INTO RFQs (RFQID, BuyerCompanyID, CreatedBy, Title, Description, Status, CreatedAt)
      VALUES
      (8842, 1, 1, N'Đơn đàm phán rượu Macallan 18 sự kiện Tết 2027', N'Macallan 18 Year Old Sherry Oak Single Malt', 'SUBMITTED', GETDATE());
      SET IDENTITY_INSERT RFQs OFF;
    `;

    // Quotations
    await sql.query`
      SET IDENTITY_INSERT Quotations ON;
      INSERT INTO Quotations (QuotationID, RFQID, BuyerCompanyID, SellerCompanyID, CreatedBy, Status, ValidUntil, CreatedAt)
      VALUES
      (9910, 8842, 1, 2, 1, 'PENDING', '2026-08-20', GETDATE());
      SET IDENTITY_INSERT Quotations OFF;
    `;

    // Seed LCDocuments if table exists
    try {
      await sql.query`
        INSERT INTO LCDocuments (BuyerCompany, LCNumber, IssuingBank, Amount, ExpiryDate, DocumentUrl, Status, CreatedAt)
        VALUES 
        (N'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', 'LC-HSBC-2026-0001', N'HSBC Việt Nam', 1500000000, '2026-12-31', '/uploads/lc_lotte_hsbc.pdf', 'VERIFIED', GETDATE())
      `;
    } catch (lcErr) {
      console.warn('Could not seed LCDocuments (table might not exist yet):', lcErr.message);
    }

    console.log('Seeder completed successfully!');
  } catch (err) {
    console.error('Error seeding SQL Server database:', err.message);
  }
}

module.exports = { seedIfEmpty };
