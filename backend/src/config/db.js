// Database Configuration & MS SQL Server Persistent Sync Engine
let sql;
let useOdbc = false;

try {
  const isWinAuth = process.platform === 'win32' && 
                    (!process.env.DB_USER || process.env.DB_USER === 'sa') && 
                    (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === '123456');
                    
  if (isWinAuth || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('Trusted_Connection=yes'))) {
    sql = require('mssql/msnodesqlv8');
    useOdbc = true;
  } else {
    sql = require('mssql');
  }
} catch (e) {
  sql = require('mssql');
}

const { seedIfEmpty } = require('./dbSeeder');

// Configure connection parameters
const dbServer = process.env.DB_SERVER || 'localhost';
const serverName = dbServer.includes('\\') ? dbServer.split('\\')[0] : dbServer;
const instanceName = dbServer.includes('\\') ? dbServer.split('\\')[1] : undefined;

const config = useOdbc ? {
  connectionString: process.env.DATABASE_URL || `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'DESKTOP-BFLA0CO\\SQLEXPRESS'};Database=B2B_Alcohol_Ecommerce;Trusted_Connection=yes;`
} : {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  server: serverName,
  database: process.env.DB_NAME || 'B2B_Alcohol_Ecommerce',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: instanceName
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
    
    try {
      mssqlPool = await sql.connect(config);
      isConnected = true;
      console.log('SUCCESSFULLY connected to MS SQL Server (Primary Driver)');
    } catch (primaryErr) {
      console.warn('Primary connection failed, trying fallback:', primaryErr.message);
      const fallbackConfig = useOdbc ? {
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || '123456',
        server: serverName,
        database: process.env.DB_NAME || 'B2B_Alcohol_Ecommerce',
        options: {
          encrypt: false,
          trustServerCertificate: true,
          instanceName: instanceName
        }
      } : {
        connectionString: process.env.DATABASE_URL || `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'DESKTOP-BFLA0CO\\SQLEXPRESS'};Database=B2B_Alcohol_Ecommerce;Trusted_Connection=yes;`
      };
      
      let altSql = require('mssql');
      try {
        if (!useOdbc) {
          altSql = require('mssql/msnodesqlv8');
        }
      } catch(e) {
        altSql = require('mssql');
      }
      mssqlPool = await altSql.connect(fallbackConfig);
      sql = altSql;
      isConnected = true;
      console.log('SUCCESSFULLY connected to MS SQL Server (Fallback Driver)');
    }

    // 1. Create LCDocuments table if it does not exist
    try {
      await mssqlPool.request().query(`
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
      `);
      console.log('LCDocuments table checked/created successfully.');

      // 1b. Create ProductPrices, Contracts, ContractPrices, Payments tables if not exist
      await mssqlPool.request().query(`
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
            [ContractNumber] VARCHAR(100) UNIQUE NOT NULL,
            [EndDate] DATETIME NULL,
            [Status] VARCHAR(50) DEFAULT 'ACTIVE'
          );
        END

        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContractPrices]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[ContractPrices] (
            [ContractPriceID] BIGINT IDENTITY(1,1) PRIMARY KEY,
            [ContractID] BIGINT NOT NULL,
            [ProductID] BIGINT NOT NULL,
            [ContractPrice] DECIMAL(18,2) NOT NULL
          );
        END

        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[Payments] (
            [PaymentID] BIGINT IDENTITY(1,1) PRIMARY KEY,
            [InvoiceID] BIGINT NOT NULL,
            [Amount] DECIMAL(18,2) NOT NULL DEFAULT 0,
            [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
            [PaymentMethod] NVARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
            [PaymentReference] NVARCHAR(100) NULL,
            [PaidAt] DATETIME NOT NULL DEFAULT GETDATE()
          );
        END
      `);
      console.log('Pricing & Payment tables checked/created successfully.');
    } catch (lcTableErr) {
      console.error('Failed to create tables:', lcTableErr.message);
    }

    // 2. Alter Invoices table to add missing Amount and PaidAmount columns if missing
    try {
      const checkCol = await mssqlPool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'Amount'
      `);
      if (checkCol.recordset.length === 0) {
        console.log('Adding missing Amount column to Invoices table...');
        await mssqlPool.request().query(`ALTER TABLE Invoices ADD Amount DECIMAL(18,2) NOT NULL DEFAULT 0`);
        console.log('Amount column added successfully.');
      }

      const checkPaidCol = await mssqlPool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'PaidAmount'
      `);
      if (checkPaidCol.recordset.length === 0) {
        console.log('Adding missing PaidAmount column to Invoices table...');
        await mssqlPool.request().query(`ALTER TABLE Invoices ADD PaidAmount DECIMAL(18,2) NOT NULL DEFAULT 0`);
        console.log('PaidAmount column added successfully.');
      }

      // Alter Payments table if columns are missing
      const checkPayPaidCol = await mssqlPool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'PaidAmount'
      `);
      if (checkPayPaidCol.recordset.length === 0) {
        console.log('Adding missing PaidAmount column to Payments table...');
        await mssqlPool.request().query(`ALTER TABLE Payments ADD PaidAmount DECIMAL(18,2) NOT NULL DEFAULT 0`);
        console.log('PaidAmount column added successfully in Payments.');
      }

      const checkPayRefCol = await mssqlPool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'PaymentReference'
      `);
      if (checkPayRefCol.recordset.length === 0) {
        console.log('Adding missing PaymentReference column to Payments table...');
        await mssqlPool.request().query(`ALTER TABLE Payments ADD PaymentReference NVARCHAR(100) NULL`);
        console.log('PaymentReference column added successfully in Payments.');
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
