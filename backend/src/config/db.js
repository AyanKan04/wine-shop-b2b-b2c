// Database Configuration & MS SQL Server Persistent Sync Engine
const sql = require('mssql');
const { seedIfEmpty } = require('./dbSeeder');

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  server: process.env.DB_SERVER || 'DESKTOP-1OOP6D0\\CHUONG',
  database: process.env.DB_NAME || 'B2B_Alcohol_Ecommerce',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_SERVER ? process.env.DB_SERVER.split('\\')[1] : 'CHUONG'
  }
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
      `;
      console.log('Pricing tables (ProductPrices, Contracts, ContractPrices) checked/created successfully.');
    } catch (lcTableErr) {
      console.error('Failed to create tables:', lcTableErr.message);
    }

    // 2. Alter Invoices table to add missing Amount column if missing
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
    } catch (colErr) {
      console.warn('Skipping column alteration checks:', colErr.message);
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
