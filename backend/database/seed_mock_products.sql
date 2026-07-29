-- ==============================================================================
-- SEED DATA: MOCK PRODUCTS FOR B2B ALCOHOL E-COMMERCE
-- Run this script to insert mock products from dbMock.js into the SQL Server database.
-- ==============================================================================

-- 1. Insert Seller Company (if not exists)
IF NOT EXISTS (SELECT 1 FROM Companies WHERE CompanyCode = 'COMP-REDAPRON')
BEGIN
    INSERT INTO Companies (CompanyCode, CompanyName, TaxCode, CompanyType, Status, Website)
    VALUES ('COMP-REDAPRON', 'MAISON DE L''ALCOOL RED APRON FACTORY', '0109876543', 'SELLER', 'ACTIVE', 'redapron.vn');
END;

DECLARE @seller_id BIGINT = (SELECT CompanyID FROM Companies WHERE CompanyCode = 'COMP-REDAPRON');

-- 2. Insert Categories
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'spirits-whisky')
    INSERT INTO Categories (CategoryName, Slug) VALUES ('Spirits / Whisky', 'spirits-whisky');
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fine-wine')
    INSERT INTO Categories (CategoryName, Slug) VALUES ('Fine Wine', 'fine-wine');
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'champagne')
    INSERT INTO Categories (CategoryName, Slug) VALUES ('Champagne', 'champagne');
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'cognac')
    INSERT INTO Categories (CategoryName, Slug) VALUES ('Cognac', 'cognac');

-- 3. Insert Products
-- Product 1: Macallan 18
IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'SKU-SCOT-MAC18')
BEGIN
    INSERT INTO Products (SellerCompanyID, CategoryID, SKU, ProductName, Slug, Description, CountryOfOrigin, AlcoholContent, VolumeML, MOQ, ImageURL)
    VALUES (
        @seller_id, 
        (SELECT CategoryID FROM Categories WHERE Slug = 'spirits-whisky'),
        'SKU-SCOT-MAC18', 'Macallan 18 Year Old Sherry Oak Single Malt', 'macallan-18-sherry-oak',
        N'Dòng Single Malt Whisky danh tiếng từ vùng Highland Scotland, ủ 18 năm trong thùng gỗ sồi Sherry Oak Tây Ban Nha.',
        'Scotland', 43.0, 700, 5,
        'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80'
    );
    DECLARE @p1 BIGINT = (SELECT ProductID FROM Products WHERE SKU = 'SKU-SCOT-MAC18');
    INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit) VALUES
    (@p1, 1, 5, 85000000), (@p1, 2, 20, 78000000), (@p1, 3, 50, 72500000), (@p1, 4, 100, 68000000), (@p1, 5, 200, 64000000);
END;

-- Product 2: Château Margaux
IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'SKU-FR-MARGAUX2018')
BEGIN
    INSERT INTO Products (SellerCompanyID, CategoryID, SKU, ProductName, Slug, Description, CountryOfOrigin, AlcoholContent, VolumeML, MOQ, ImageURL)
    VALUES (
        @seller_id, 
        (SELECT CategoryID FROM Categories WHERE Slug = 'fine-wine'),
        'SKU-FR-MARGAUX2018', 'Château Margaux Premier Grand Cru Classé 2018', 'chateau-margaux-2018',
        N'Vang đỏ huyền thoại thuộc bảng xếp hạng Premier Grand Cru Classé 1855 trứ danh vùng Margaux Bordeaux.',
        'France', 13.5, 750, 10,
        'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?auto=format&fit=crop&w=800&q=80'
    );
    DECLARE @p2 BIGINT = (SELECT ProductID FROM Products WHERE SKU = 'SKU-FR-MARGAUX2018');
    INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit) VALUES
    (@p2, 1, 10, 120000000), (@p2, 2, 30, 110000000), (@p2, 3, 100, 98000000), (@p2, 4, 250, 92000000), (@p2, 5, 500, 85000000);
END;

-- Product 3: Dom Pérignon
IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'SKU-FR-DOM2012')
BEGIN
    INSERT INTO Products (SellerCompanyID, CategoryID, SKU, ProductName, Slug, Description, CountryOfOrigin, AlcoholContent, VolumeML, MOQ, ImageURL)
    VALUES (
        @seller_id, 
        (SELECT CategoryID FROM Categories WHERE Slug = 'champagne'),
        'SKU-FR-DOM2012', 'Dom Pérignon Vintage Brut Champagne 2012', 'dom-perignon-2012',
        N'Tuyệt phẩm Sâm-panh Pháp niên hiệu 2012 đạt sự cân bằng tuyệt hảo giữa hương hoa quả nhiệt đới và khoáng chất.',
        'France', 12.5, 750, 8,
        'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80'
    );
    DECLARE @p3 BIGINT = (SELECT ProductID FROM Products WHERE SKU = 'SKU-FR-DOM2012');
    INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit) VALUES
    (@p3, 1, 8, 45000000), (@p3, 2, 25, 41000000), (@p3, 3, 75, 37500000), (@p3, 4, 150, 34000000), (@p3, 5, 300, 31000000);
END;

-- Product 4: Hennessy X.O
IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'SKU-FR-HENNESSY-XO')
BEGIN
    INSERT INTO Products (SellerCompanyID, CategoryID, SKU, ProductName, Slug, Description, CountryOfOrigin, AlcoholContent, VolumeML, MOQ, ImageURL)
    VALUES (
        @seller_id, 
        (SELECT CategoryID FROM Categories WHERE Slug = 'cognac'),
        'SKU-FR-HENNESSY-XO', 'Hennessy X.O Cognac Extra Old Edition', 'hennessy-xo',
        N'Dòng Cognac X.O trứ danh nguyên bản từ năm 1870, phối trộn hơn 100 loại eaux-de-vie lâu năm.',
        'France', 40.0, 700, 6,
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'
    );
    DECLARE @p4 BIGINT = (SELECT ProductID FROM Products WHERE SKU = 'SKU-FR-HENNESSY-XO');
    INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit) VALUES
    (@p4, 1, 6, 65000000), (@p4, 2, 20, 60000000), (@p4, 3, 50, 54000000), (@p4, 4, 100, 50000000), (@p4, 5, 200, 46000000);
END;

PRINT 'Mock Products inserted successfully.';
