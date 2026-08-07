// Database Configuration & MS SQL Server Persistent Sync Engine with Cloud Fallback
const bcrypt = require('bcryptjs');

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
  if (!mssqlPool) {
     throw new Error("Không thể kết nối đến Database. Dịch vụ tạm thời gián đoạn.");
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
    } catch (lcTableErr) {
      console.error('Failed to create tables:', lcTableErr.message);
    }

    // 3. Seed database if empty
    await seedIfEmpty(sql);

  } catch (err) {
    console.error('DATABASE connection or initialization failed (Activating Cloud In-Memory Engine):', err.message);
  }
}

// Start database connection
connectDB();

module.exports = {
  sql,
  getPool
};
