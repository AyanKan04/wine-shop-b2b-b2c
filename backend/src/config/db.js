// Database Configuration & MS SQL Server Persistent Sync Engine
const sql = require('mssql');
const { seedIfEmpty } = require('./dbSeeder');

const config = {
  connectionString: process.env.DATABASE_URL || 'Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-BFLA0CO\\SQLEXPRESS;Database=B2B_Alcohol_Ecommerce;Trusted_Connection=yes;'
};

let isConnected = false;
let mssqlPool = null;

const getPool = async () => {
  if (!isConnected || !mssqlPool) {
    await connectDB();
  }
  return mssqlPool;
};

// Establish connection to SQL Server & Sync DB State
async function connectDB() {
  try {
    console.log('Connecting to MS SQL Server database...');
    mssqlPool = await sql.connect(config);
    isConnected = true;
    console.log('SUCCESSFULLY connected to MS SQL Server (Windows Auth / SA Auth)');

    // 1. Create LCDocuments table if it does not exist
    try {
      await sql.query`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LCDocuments]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[LCDocuments] (
            [LCID] INT IDENTITY(1,1) PRIMARY KEY,
            [BuyerCompany] NVARCHAR(255) NOT NULL,
            [LCNumber] NVARCHAR(100) NOT NULL,
            [IssuingBank] NVARCHAR(255) NOT NULL,
            [Amount] DECIMAL(18,2) NOT NULL,
            [ExpiryDate] DATE NOT NULL,
            [DocumentUrl] NVARCHAR(500) NOT NULL,
            [Status] NVARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
          )
        END
      `;
      console.log('LCDocuments table checked/created successfully.');

      // 1b. Create ProductPrices, Contracts, ContractPrices tables if not exist
      await sql.query`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductPrices]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[ProductPrices] (
            [PriceID] BIGINT IDENTITY(1,1) PRIMARY KEY,
            [ProductID] BIGINT NOT NULL,
            [CostPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
            [BasePrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
          );
        END

        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contracts]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[Contracts] (
            [ContractID] BIGINT IDENTITY(1,1) PRIMARY KEY,
            [BuyerCompanyID] BIGINT NOT NULL,
            [ContractNumber] NVARCHAR(100) NOT NULL,
            [EndDate] DATETIME NULL,
            [Status] NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
          );
        END

        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContractPrices]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[ContractPrices] (
            [ContractPriceID] BIGINT IDENTITY(1,1) PRIMARY KEY,
            [ContractID] BIGINT NOT NULL,
            [ProductID] BIGINT NOT NULL,
            [ContractPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
          );
        END

        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[Payments] (
            [PaymentID] BIGINT IDENTITY(1,1) PRIMARY KEY,
            [InvoiceID] BIGINT NOT NULL,
            [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
            [PaymentMethod] NVARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
            [PaymentReference] NVARCHAR(100) NULL,
            [PaidAt] DATETIME NOT NULL DEFAULT GETDATE()
          );
        END
      `;
      console.log('Pricing & Payment tables checked/created successfully.');
    } catch (lcTableErr) {
      console.error('Failed to create tables:', lcTableErr.message);
    }

    // 2. Alter Invoices table to add missing Amount and PaidAmount columns if missing
    try {
      const checkCol = await sql.query`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'Amount'
      `;
      if (checkCol.recordset.length === 0) {
        console.log('Adding missing Amount column to Invoices table...');
        await sql.query`ALTER TABLE Invoices ADD Amount DECIMAL(18,2) NOT NULL DEFAULT 0`;
        console.log('Amount column added successfully.');
      }

      const checkPaidCol = await sql.query`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'PaidAmount'
      `;
      if (checkPaidCol.recordset.length === 0) {
        console.log('Adding missing PaidAmount column to Invoices table...');
        await sql.query`ALTER TABLE Invoices ADD PaidAmount DECIMAL(18,2) NOT NULL DEFAULT 0`;
        console.log('PaidAmount column added successfully.');
      }

      // Check Payments table columns
      const checkPayAmtCol = await sql.query`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'PaidAmount'
      `;
      if (checkPayAmtCol.recordset.length === 0) {
        await sql.query`ALTER TABLE Payments ADD PaidAmount DECIMAL(18,2) NOT NULL DEFAULT 0`;
      }

      const checkPayRefCol = await sql.query`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'PaymentReference'
      `;
      if (checkPayRefCol.recordset.length === 0) {
        await sql.query`ALTER TABLE Payments ADD PaymentReference NVARCHAR(100) NULL`;
      }
    } catch (colErr) {
      console.warn('Skipping column alteration checks:', colErr.message);
    }

    // 2.3 Alter RFQs table to add missing ProductID, RequestedQuantity, TargetPrice, DeliveryDate if missing
    try {
      const checkCol = await sql.query`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'RFQs' AND COLUMN_NAME = 'ProductID'
      `;
      if (checkCol.recordset.length === 0) {
        console.log('Adding missing ProductID, RequestedQuantity, TargetPrice, DeliveryDate columns to RFQs table...');
        await sql.query`
          ALTER TABLE RFQs ADD ProductID BIGINT NULL;
          ALTER TABLE RFQs ADD RequestedQuantity INT NULL;
          ALTER TABLE RFQs ADD TargetPrice DECIMAL(18,2) NULL;
          ALTER TABLE RFQs ADD DeliveryDate DATE NULL;
        `;
        try {
          await sql.query`ALTER TABLE RFQs ADD FOREIGN KEY (ProductID) REFERENCES Products(ProductID)`;
        } catch (fkErr) {
          console.warn('Could not add Foreign Key to RFQs.ProductID:', fkErr.message);
        }
        console.log('RFQs columns added successfully.');
      }
    } catch (rfqColErr) {
      console.warn('Skipping RFQ column alteration checks:', rfqColErr.message);
    }

    // 2.5 Ensure additional pricing tables exist (CustomerPrices, Contracts, ContractPrices)
    try {
      await sql.query`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CustomerPrices]') AND type in (N'U'))
        BEGIN
            CREATE TABLE CustomerPrices (
                PriceID BIGINT IDENTITY(1,1) PRIMARY KEY,
                ProductID BIGINT NOT NULL,
                BuyerCompanyID BIGINT NOT NULL,
                PricePerUnit DECIMAL(18,2) NOT NULL,
                FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
                FOREIGN KEY (BuyerCompanyID) REFERENCES Companies(CompanyID) ON DELETE CASCADE
            );
        END
      `;
      await sql.query`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contracts]') AND type in (N'U'))
        BEGIN
            CREATE TABLE Contracts (
                ContractID BIGINT IDENTITY(1,1) PRIMARY KEY,
                BuyerCompanyID BIGINT NOT NULL,
                ContractNumber VARCHAR(100) UNIQUE NOT NULL,
                EndDate DATETIME,
                Status VARCHAR(50) DEFAULT 'ACTIVE',
                FOREIGN KEY (BuyerCompanyID) REFERENCES Companies(CompanyID) ON DELETE CASCADE
            );
        END
      `;
      await sql.query`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContractPrices]') AND type in (N'U'))
        BEGIN
            CREATE TABLE ContractPrices (
                ContractPriceID BIGINT IDENTITY(1,1) PRIMARY KEY,
                ContractID BIGINT NOT NULL,
                ProductID BIGINT NOT NULL,
                ContractPrice DECIMAL(18,2) NOT NULL,
                FOREIGN KEY (ContractID) REFERENCES Contracts(ContractID) ON DELETE CASCADE,
                FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
            );
        END
      `;
      console.log('Additional pricing tables verified/created successfully.');
    } catch (pricingTablesErr) {
      console.error('Failed to create additional pricing tables:', pricingTablesErr.message);
    }

    // 3. Seed database if empty
    await seedIfEmpty(sql);

  } catch (err) {
    console.error('DATABASE connection or initialization failed:', err.message);
  }
}

// Start database connection
connectDB();

module.exports = {
  sql,
  getPool
};
