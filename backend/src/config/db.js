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

// In-Memory Cloud Fallback Data Engine for Render/Vercel Cloud Deployment
const passwordHash = bcrypt.hashSync('Password123!', 10);
const memoryDb = {
  products: [
    {
      ProductID: 101, SKU: 'SKU-SCOT-MAC18', ProductName: 'Macallan 18 Year Old Sherry Oak Single Malt', CategoryName: 'Spirits / Whisky', CountryOfOrigin: 'Scotland', Region: 'Highland', GrapeVariety: 'Single Malt', VintageYear: 2018, AlcoholContent: 43.0, VolumeML: 700, MOQ: 5, ImageURL: '/assets/images/macallen.png', CostPrice: 52000000, BasePrice: 68000000, Description: 'Dòng Single Malt Whisky danh tiếng từ vùng Highland Scotland, ủ 18 năm trong thùng gỗ sồi Sherry Oak Tây Ban Nha.', Status: 'ACTIVE',
      tier_prices: JSON.stringify([{ TierLevel: 1, MinQuantity: 5, PricePerUnit: 68000000 }, { TierLevel: 2, MinQuantity: 20, PricePerUnit: 65000000 }])
    },
    {
      ProductID: 102, SKU: 'SKU-FR-MARGAUX2018', ProductName: 'Château Margaux Premier Grand Cru Classé 2018', CategoryName: 'Vang Đỏ (Red Wine)', CountryOfOrigin: 'France', Region: 'Bordeaux', GrapeVariety: 'Cabernet Sauvignon', VintageYear: 2018, AlcoholContent: 13.5, VolumeML: 750, MOQ: 10, ImageURL: '/assets/images/margaux.png', CostPrice: 18000000, BasePrice: 24000000, Description: 'Vang đỏ huyền thoại thuộc bảng xếp hạng Premier Grand Cru Classé 1855 trứ danh vùng Margaux Bordeaux.', Status: 'ACTIVE',
      tier_prices: JSON.stringify([{ TierLevel: 1, MinQuantity: 10, PricePerUnit: 24000000 }])
    },
    {
      ProductID: 103, SKU: 'SKU-FR-DOM2012', ProductName: 'Dom Pérignon Vintage Brut Champagne 2012', CategoryName: 'Champagne & Vang Sủi', CountryOfOrigin: 'France', Region: 'Champagne', GrapeVariety: 'Chardonnay & Pinot Noir', VintageYear: 2012, AlcoholContent: 12.5, VolumeML: 750, MOQ: 8, ImageURL: '/assets/images/dom.png', CostPrice: 5800000, BasePrice: 7500000, Description: 'Tuyệt phẩm Sâm-panh Pháp niên hiệu 2012 đạt sự cân bằng tuyệt hảo giữa hương hoa quả nhiệt đới và khoáng chất.', Status: 'ACTIVE',
      tier_prices: JSON.stringify([{ TierLevel: 1, MinQuantity: 8, PricePerUnit: 7500000 }])
    },
    {
      ProductID: 104, SKU: 'SKU-FR-HENNESSY-XO', ProductName: 'Hennessy X.O Cognac Extra Old Edition', CategoryName: 'Spirits / Cognac', CountryOfOrigin: 'France', Region: 'Cognac', GrapeVariety: 'Ugni Blanc', VintageYear: 2020, AlcoholContent: 40.0, VolumeML: 700, MOQ: 6, ImageURL: '/assets/images/hennessy.png', CostPrice: 4200000, BasePrice: 5600000, Description: 'Dòng Cognac X.O trứ danh nguyên bản từ năm 1870, phối trộn hơn 100 loại eaux-de-vie lâu năm.', Status: 'ACTIVE',
      tier_prices: JSON.stringify([{ TierLevel: 1, MinQuantity: 6, PricePerUnit: 5600000 }])
    }
  ],
  users: [
    { UserID: 1, CompanyID: 1, Username: 'lotte_buyer', Email: 'buyer@lottesaigon.com', PasswordHash: passwordHash, UserType: 'BUYER_REP', Role: 'BUYER_REP', Status: 'ACTIVE', FirstName: 'Nguyễn', LastName: 'Mua Hàng' },
    { UserID: 2, CompanyID: 2, Username: 'admin_user', Email: 'admin@redapron.vn', PasswordHash: passwordHash, UserType: 'PLATFORM_ADMIN', Role: 'PLATFORM_ADMIN', Status: 'ACTIVE', FirstName: 'Trần', LastName: 'Quản Trị' },
    { UserID: 3, CompanyID: 3, Username: 'continental_buyer', Email: 'purchasing@continental.vn', PasswordHash: passwordHash, UserType: 'BUYER_REP', Role: 'BUYER_REP', Status: 'ACTIVE', FirstName: 'Lê', LastName: 'Hải' }
  ],
  companies: [
    { CompanyID: 1, CompanyCode: 'COMP-LOTTE', CompanyName: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', CompanyType: 'BUYER', Status: 'ACTIVE' },
    { CompanyID: 2, CompanyCode: 'COMP-REDAPRON', CompanyName: 'MAISON DE L\'ALCOOL RED APRON FACTORY', CompanyType: 'SELLER', Status: 'ACTIVE' }
  ],
  creditLimits: [
    { CompanyID: 1, CreditLimitAmount: 1000000000, UsedAmount: 150000000, AvailableAmount: 850000000 }
  ],
  invoices: [
    { InvoiceID: 8184, OrderID: 8842, InvoiceNumber: 'INV-2026-8184', InvoiceDate: new Date('2026-08-01'), DueDate: new Date('2026-08-20'), Status: 'UNPAID', Amount: 150000000, PaidAmount: 0, BuyerCompany: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', BuyerCompanyID: 1, OrderNumber: 'ORD-2026-8842' },
    { InvoiceID: 8891, OrderID: 8821, InvoiceNumber: 'INV-2026-8891', InvoiceDate: new Date('2026-07-15'), DueDate: new Date('2026-08-15'), Status: 'PAID', Amount: 200000000, PaidAmount: 200000000, BuyerCompany: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', BuyerCompanyID: 1, OrderNumber: 'ORD-2026-8821' }
  ],
  orders: [
    { OrderID: 8842, OrderNumber: 'ORD-2026-8842', BuyerCompanyID: 1, buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', TotalAmount: 150000000, OrderStatus: 'PROCESSING', PaymentMethod: 'NET_30_CREDIT', CreatedAt: new Date('2026-08-01') },
    { OrderID: 8821, OrderNumber: 'ORD-2026-8821', BuyerCompanyID: 1, buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', TotalAmount: 200000000, OrderStatus: 'COMPLETED', PaymentMethod: 'NET_30_CREDIT', CreatedAt: new Date('2026-07-15') }
  ],
  rfqs: [
    { rfq_id: 5001, RFQID: 5001, BuyerCompanyID: 1, title: 'RFQ Mua Sỉ Macallan 18 Year Old', buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', product_name: 'Macallan 18 Year Old Sherry Oak Single Malt', quantity: 20, target_price: 65000000, status: 'PENDING', created_at: new Date().toISOString() }
  ],
  quotations: [
    { quotation_id: 9001, QuotationID: 9001, rfq_id: 5001, RFQID: 5001, BuyerCompanyID: 1, buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', offer_unit_price: 64000000, quantity: 20, status: 'PENDING', valid_until: '2026-12-31' }
  ],
  lcDocuments: [],
  licenses: [
    { LicenseID: 1, CompanyID: 1, LicenseType: 'Giấy phép Bán buôn & Phân phối Rượu', LicenseNumber: '108/GP-BCT', Status: 'VERIFIED' }
  ],
  inventory: [
    { ProductID: 101, QuantityOnHand: 150, ReservedQuantity: 20 },
    { ProductID: 102, QuantityOnHand: 80, ReservedQuantity: 10 },
    { ProductID: 103, QuantityOnHand: 60, ReservedQuantity: 8 },
    { ProductID: 104, QuantityOnHand: 120, ReservedQuantity: 15 }
  ]
};

const createMockPool = () => {
  const transactionMock = () => {
    return {
      begin: async () => {},
      commit: async () => {},
      rollback: async () => {},
      request: () => createMockPool().request()
    };
  };

  const poolObj = {
    transaction: transactionMock,
    request: () => {
      const inputs = {};
      const reqObj = {
        input: (name, type, val) => {
          inputs[name] = (val !== undefined) ? val : type;
          return reqObj;
        },
        query: async (queryString) => {
          const q = String(queryString).toLowerCase();

          // 1. Users login / getMe
          if (q.includes('users')) {
            if (inputs.Username) {
              const u = memoryDb.users.find(x => x.Username.toLowerCase() === String(inputs.Username).toLowerCase());
              return { recordset: u ? [u] : [] };
            }
            if (inputs.UserID) {
              const u = memoryDb.users.find(x => x.UserID == inputs.UserID);
              return { recordset: u ? [u] : [] };
            }
            return { recordset: memoryDb.users };
          }

          // 2. Products query
          if (q.includes('products')) {
            if (inputs.ProductID) {
              const p = memoryDb.products.find(x => x.ProductID == inputs.ProductID);
              return { recordset: p ? [p] : [] };
            }
            let prods = [...memoryDb.products];
            if (inputs.Search) {
              const s = String(inputs.Search).replace(/%/g, '').toLowerCase();
              prods = prods.filter(p => p.ProductName.toLowerCase().includes(s) || p.SKU.toLowerCase().includes(s));
            }
            return { recordset: prods };
          }

          // 3. CreditLimits
          if (q.includes('creditlimits')) {
            const cid = inputs.CompanyID || 1;
            let c = memoryDb.creditLimits.find(x => x.CompanyID == cid);
            if (!c) {
              c = { CompanyID: cid, CreditLimitAmount: 1000000000, UsedAmount: 0, AvailableAmount: 1000000000 };
              memoryDb.creditLimits.push(c);
            }
            if (q.includes('update')) {
              if (inputs.LCAmount) {
                c.CreditLimitAmount += Number(inputs.LCAmount);
                c.AvailableAmount += Number(inputs.LCAmount);
              }
            }
            return { recordset: [c] };
          }

          // 4. Invoices
          if (q.includes('invoices')) {
            let invs = [...memoryDb.invoices];
            if (inputs.BuyerCompanyID) {
              invs = invs.filter(i => i.BuyerCompanyID == inputs.BuyerCompanyID);
            }
            return { recordset: invs };
          }

          // 5. Orders
          if (q.includes('orders')) {
            let ords = [...memoryDb.orders];
            if (inputs.CompanyID || inputs.BuyerCompanyID) {
              const cid = inputs.CompanyID || inputs.BuyerCompanyID;
              ords = ords.filter(o => o.BuyerCompanyID == cid);
            }
            return { recordset: ords };
          }

          // 6. RFQs
          if (q.includes('insert into rfqs') || q.includes('rfqs')) {
            if (q.includes('insert')) {
              const newId = 5000 + memoryDb.rfqs.length + 1;
              const newRfq = {
                rfq_id: newId,
                RFQID: newId,
                BuyerCompanyID: inputs.BuyerCompanyID || 1,
                title: inputs.Title || 'RFQ Mua Sỉ Rượu',
                product_name: inputs.ProductName || 'Hennessy XO',
                quantity: inputs.RequestedQuantity || 10,
                target_price: inputs.TargetUnitPrice || 45000000,
                buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
                status: 'PENDING',
                created_at: new Date().toISOString()
              };
              memoryDb.rfqs.push(newRfq);
              return { recordset: [{ RFQID: newId }] };
            }
            return { recordset: memoryDb.rfqs.map(r => ({ ...r, RFQID: r.rfq_id || r.RFQID, BuyerCompany: r.buyer_company })) };
          }

          // 7. Quotations
          if (q.includes('insert into quotations') || q.includes('quotations')) {
            if (q.includes('insert')) {
              const newId = 9000 + memoryDb.quotations.length + 1;
              const newQ = {
                quotation_id: newId,
                QuotationID: newId,
                rfq_id: inputs.RFQID,
                RFQID: inputs.RFQID,
                BuyerCompanyID: inputs.BuyerCompanyID || 1,
                offer_unit_price: inputs.OfferUnitPrice || 44000000,
                quantity: inputs.Quantity || 10,
                buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
                status: 'PENDING',
                valid_until: '2026-12-31'
              };
              memoryDb.quotations.push(newQ);
              return { recordset: [{ QuotationID: newId }] };
            }
            return { recordset: memoryDb.quotations };
          }

          // 8. LCDocuments
          if (q.includes('lcdocuments')) {
            if (q.includes('insert')) {
              const newId = 7000 + memoryDb.lcDocuments.length + 1;
              const newLc = {
                LCID: newId,
                lc_id: newId,
                BuyerCompany: inputs.BuyerCompany || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
                LCNumber: inputs.LCNumber || 'LC-12345',
                IssuingBank: inputs.IssuingBank || 'VIETCOMBANK',
                Amount: inputs.Amount || 500000000,
                ExpiryDate: inputs.ExpiryDate || new Date(),
                Status: 'SUBMITTED'
              };
              memoryDb.lcDocuments.push(newLc);
              return { recordset: [{ LCID: newId }] };
            }
            if (q.includes('update')) {
              if (inputs.LCID && inputs.Status) {
                const lc = memoryDb.lcDocuments.find(x => x.LCID == inputs.LCID);
                if (lc) lc.Status = inputs.Status;
              }
              return { recordset: [] };
            }
            return { recordset: memoryDb.lcDocuments };
          }

          // 9. Companies & Licenses & Inventory
          if (q.includes('companylicenses')) return { recordset: memoryDb.licenses };
          if (q.includes('inventories')) return { recordset: memoryDb.inventory };
          if (q.includes('companies')) return { recordset: memoryDb.companies };

          return { recordset: [] };
        }
      };
      return reqObj;
    }
  };
  return poolObj;
};

const getPool = async () => {
  if (!isConnected || !mssqlPool) {
    await connectDB();
  }
  return mssqlPool || createMockPool();
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
