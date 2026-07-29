-- ==============================================================================
-- MS SQL SERVER SCHEMA UPDATES - B2B ALCOHOL E-COMMERCE (RUUBUSINESS)
-- Chạy script này trên SQL Server sau khi đã chạy script gốc của bạn
-- ==============================================================================

-- Bổ sung bảng CustomerPrices
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CustomerPrices]') AND type in (N'U'))
BEGIN
    CREATE TABLE CustomerPrices (
        PriceID BIGINT IDENTITY(1,1) PRIMARY KEY,
        ProductID BIGINT NOT NULL,
        BuyerCompanyID BIGINT NOT NULL,
        PricePerUnit DECIMAL(18,2) NOT NULL,
        FOREIGN KEY (ProductID) REFERENCES Products(product_id) ON DELETE CASCADE,
        FOREIGN KEY (BuyerCompanyID) REFERENCES Companies(company_id) ON DELETE CASCADE
    );
END
GO

-- Bổ sung bảng Contracts
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contracts]') AND type in (N'U'))
BEGIN
    CREATE TABLE Contracts (
        ContractID BIGINT IDENTITY(1,1) PRIMARY KEY,
        BuyerCompanyID BIGINT NOT NULL,
        ContractNumber VARCHAR(100) UNIQUE NOT NULL,
        EndDate DATETIME,
        Status VARCHAR(50) DEFAULT 'ACTIVE',
        FOREIGN KEY (BuyerCompanyID) REFERENCES Companies(company_id) ON DELETE CASCADE
    );
END
GO

-- Bổ sung bảng ContractPrices
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContractPrices]') AND type in (N'U'))
BEGIN
    CREATE TABLE ContractPrices (
        ContractPriceID BIGINT IDENTITY(1,1) PRIMARY KEY,
        ContractID BIGINT NOT NULL,
        ProductID BIGINT NOT NULL,
        ContractPrice DECIMAL(18,2) NOT NULL,
        FOREIGN KEY (ContractID) REFERENCES Contracts(ContractID) ON DELETE CASCADE,
        FOREIGN KEY (ProductID) REFERENCES Products(product_id) ON DELETE CASCADE
    );
END
GO
