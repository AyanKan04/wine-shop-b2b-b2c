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
    { CompanyID: 2, CompanyCode: 'COMP-REDAPRON', CompanyName: 'MAISON DE L\'ALCOOL RED APRON FACTORY', CompanyType: 'SELLER', Status: 'ACTIVE' },
    { CompanyID: 3, CompanyCode: 'COMP-CONTINENTAL', CompanyName: 'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL', CompanyType: 'BUYER', Status: 'ACTIVE' },
    { CompanyID: 4, CompanyCode: 'COMP-FURAMA', CompanyName: 'CÔNG TY CP KHÁCH SẠN FURAMA ĐÀ NẴNG', CompanyType: 'BUYER', Status: 'ACTIVE' },
    { CompanyID: 5, CompanyCode: 'COMP-SAIGONCOOP', CompanyName: 'LIÊN HIỆP HTX THƯƠNG MẠI TP.HCM - SAIGON CO.OP', CompanyType: 'BUYER', Status: 'ACTIVE' },
    { CompanyID: 6, CompanyCode: 'COMP-DALATWINE', CompanyName: 'NHÀ MÁY VANG ĐÀ LẠT - DALAT WINE JSC', CompanyType: 'SELLER', Status: 'ACTIVE' }
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
    { rfq_id: 5001, RFQID: 5001, BuyerCompanyID: 1, title: 'RFQ Mua Sỉ Macallan 18 Year Old', buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', product_name: 'Macallan 18 Year Old Sherry Oak Single Malt', quantity: 20, target_price: 65000000, status: 'SUBMITTED', created_at: new Date().toISOString() }
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
  ],
  rfqMessages: [
    {
      MessageID: 1,
      RFQID: 999,
      SenderName: 'AI Sommelier Assistant',
      SenderRole: 'AI_ASSISTANT',
      MessageText: 'Xin kính chào quý đối tác. Tôi là chuyên gia thử nếm kiêm Trợ lý ảo của Red Apron. Quý đối tác cần tư vấn về niên vụ, nồng độ ABV, MOQ hay chính sách chiết khấu sỉ của dòng rượu nào?',
      CreatedAt: new Date()
    }
  ]
};

const createMockPool = () => {
  const transactionMock = () => {
    return {
      begin: async () => {},
      commit: async () => {},
      rollback: async () => {},
      request: () => poolObj.request()
    };
  };

  const poolObj = {
    isMock: true,
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

          // 0. Dashboard KPI Aggregations & Analytics
          if (q.includes('sum(totalamount)') || q.includes('total_revenue')) {
            const tot = memoryDb.orders.reduce((acc, o) => acc + (Number(o.TotalAmount) || 0), 0);
            return { recordset: [{ total_revenue: tot || 350000000 }] };
          }
          if (q.includes('count(*)') && q.includes('products')) {
            return { recordset: [{ count: memoryDb.products.length || 10 }] };
          }
          if (q.includes('count(*)') && q.includes('companies')) {
            return { recordset: [{ count: memoryDb.companies.length || 6 }] };
          }
          if (q.includes('companylicenses') && q.includes('pending_verification')) {
            return { recordset: [{ count: 1 }] };
          }
          if (q.includes('inventories') && (q.includes('sum') || q.includes('quantityonhand') || q.includes('total_inventory'))) {
            const totInv = memoryDb.inventory.reduce((acc, i) => acc + (Number(i.QuantityOnHand) || 0), 0);
            return { recordset: [{ total_inventory: totInv || 410 }] };
          }
          if (q.includes('count(*)') && q.includes('rfqs')) {
            return { recordset: [{ count: memoryDb.rfqs.length || 3 }] };
          }
          if (q.includes('unpaid_invoices') || (q.includes('invoices') && q.includes('unpaid'))) {
            const unpInvs = memoryDb.invoices.filter(i => i.Status === 'UNPAID');
            const unpAmt = unpInvs.reduce((acc, i) => acc + (Number(i.Amount) || 0), 0);
            return { recordset: [{ unpaid_invoices: unpInvs.length || 1, unpaid_amount: unpAmt || 150000000 }] };
          }
          if (q.includes('count(*)') && q.includes('shipments')) {
            return { recordset: [{ count: 1 }] };
          }
          if (q.includes('month(createdat)') || q.includes('month as month')) {
            return {
              recordset: [
                { month: 'T5', revenue: 180000000, orders: 3 },
                { month: 'T6', revenue: 240000000, orders: 4 },
                { month: 'T7', revenue: 310000000, orders: 5 },
                { month: 'T8', revenue: 350000000, orders: 6 }
              ]
            };
          }
          if (q.includes('top 5') || q.includes('orderitems')) {
            return {
              recordset: [
                { name: 'Macallan 18 Year Old Sherry Oak', revenue: 204000000 },
                { name: 'Château Margaux Premier 2018', revenue: 168000000 },
                { name: 'Hennessy X.O Cognac Extra Old', revenue: 134400000 },
                { name: 'Dom Pérignon Vintage Brut 2012', revenue: 90000000 }
              ]
            };
          }
          if (q.includes('activityfeed') || q.includes('auditlogs')) {
            return {
              recordset: [
                { id: 'ACT-101', timestamp: new Date().toISOString(), module: 'Bán Hàng', action: 'Phát hành báo giá Quotation #9001', actor: 'Trần Quản Trị', icon: 'fa-file-invoice-dollar', color: '#D4AF37' },
                { id: 'ACT-102', timestamp: new Date().toISOString(), module: 'Tài Chính', action: 'Phê duyệt Thư tín dụng L/C +500 Tr ₫', actor: 'Lý Kế Toán', icon: 'fa-shield-check', color: '#10B981' },
                { id: 'ACT-103', timestamp: new Date().toISOString(), module: 'Bán Hàng', action: 'Yêu cầu báo giá RFQ mới từ Lotte Saigon', actor: 'Nguyễn Mua Hàng', icon: 'fa-cart-shopping', color: '#3B82F6' },
                { id: 'ACT-104', timestamp: new Date().toISOString(), module: 'Kho & Vận Chuyển', action: 'Vận đơn ORD-2026-8821 đã phát thành công', actor: 'Đặng Kho', icon: 'fa-truck', color: '#8B5CF6' }
              ]
            };
          }

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

          // 2. ProductTierPrices & ProductPrices Persistence (Mock Engine SQL Handler)
          if (q.includes('delete from producttierprices') || q.includes('insert into producttierprices')) {
            const pid = inputs.ProductID || 101;
            const p = memoryDb.products.find(x => x.ProductID == pid);
            if (p) {
              let currentTiers = [];
              try {
                currentTiers = typeof p.tier_prices === 'string' ? JSON.parse(p.tier_prices) : (p.tier_prices || []);
              } catch(e) { currentTiers = []; }

              if (q.includes('delete')) {
                currentTiers = [];
              } else if (q.includes('insert')) {
                const newT = {
                  TierLevel: Number(inputs.TierLevel || 1),
                  MinQuantity: Number(inputs.MinQuantity || 1),
                  PricePerUnit: Number(inputs.PricePerUnit || 0)
                };
                currentTiers = currentTiers.filter(t => Number(t.TierLevel || t.tier_level) !== newT.TierLevel);
                currentTiers.push(newT);
                currentTiers.sort((a,b) => Number(a.TierLevel || a.tier_level) - Number(b.TierLevel || b.tier_level));
              }
              p.tier_prices = JSON.stringify(currentTiers);
            }
            return { recordset: [] };
          }

          if (q.includes('update productprices') || q.includes('insert into productprices')) {
            const pid = inputs.ProductID || 101;
            const p = memoryDb.products.find(x => x.ProductID == pid);
            if (p) {
              if (inputs.CostPrice !== undefined) p.CostPrice = Number(inputs.CostPrice);
              if (inputs.BasePrice !== undefined) p.BasePrice = Number(inputs.BasePrice);
            }
            return { recordset: [] };
          }

          // 3. Warehouse Inventories Persistence
          if (q.includes('inventories')) {
            if (q.includes('update')) {
              const pid = inputs.ProductID;
              const inv = memoryDb.inventory.find(x => x.ProductID == pid);
              if (inv) {
                if (q.includes('+')) {
                  inv.QuantityOnHand = (inv.QuantityOnHand || 0) + Number(inputs.Qty || 0);
                } else if (q.includes('-')) {
                  inv.QuantityOnHand = (inv.QuantityOnHand || 0) - Number(inputs.Qty || 0);
                }
              }
              return { recordset: [] };
            }
            if (q.includes('insert')) {
              const pid = inputs.ProductID;
              if (pid && !memoryDb.inventory.some(x => x.ProductID == pid)) {
                memoryDb.inventory.push({ ProductID: pid, QuantityOnHand: 0, ReservedQuantity: 0 });
              }
              return { recordset: [] };
            }
            const invs = memoryDb.inventory.map(inv => {
              const p = memoryDb.products.find(x => x.ProductID == inv.ProductID);
              const qoh = Number(inv.QuantityOnHand || 0);
              const res = Number(inv.ReservedQuantity || 0);
              return {
                InventoryID: inv.InventoryID || inv.ProductID,
                ProductID: inv.ProductID,
                QuantityOnHand: qoh,
                ReservedQuantity: res,
                ProductName: p ? p.ProductName : `Sản Phẩm #${inv.ProductID}`,
                SKU: p ? p.SKU : `SKU-${inv.ProductID}`,
                ImageUrl: p ? (p.ImageURL || p.image_url) : '/assets/images/macallen.png',
                available: qoh - res > 0 ? qoh - res : 0,
                stock_status: (qoh - res <= 30) ? 'LOW' : 'OK'
              };
            });
            return { recordset: invs };
          }

          // 4. Products query
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

          // 4. CreditLimits
          if (q.includes('creditlimits')) {
            const cid = inputs.CompanyID || 1;
            let c = memoryDb.creditLimits.find(x => x.CompanyID == cid);
            if (!c) {
              c = { CompanyID: cid, CreditLimitAmount: 1000000000, UsedAmount: 150000000, AvailableAmount: 850000000 };
              memoryDb.creditLimits.push(c);
            }
            if (q.includes('update')) {
              if (inputs.LCAmount) {
                c.CreditLimitAmount += Number(inputs.LCAmount);
                c.AvailableAmount += Number(inputs.LCAmount);
              }
              if (inputs.PaidAmount !== undefined) {
                const payVal = Number(inputs.PaidAmount);
                c.UsedAmount = c.UsedAmount - payVal < 0 ? 0 : c.UsedAmount - payVal;
                c.AvailableAmount = c.CreditLimitAmount - c.UsedAmount;
              }
            }
            return { recordset: [c] };
          }

          // 5. Invoices Persistence
          if (q.includes('invoices')) {
            if (q.includes('update')) {
              const invId = inputs.InvoiceID || inputs.invoiceid || 8184;
              const inv = memoryDb.invoices.find(x => x.InvoiceID == invId);
              if (inv) {
                const paidVal = inputs.PaidAmount !== undefined ? Number(inputs.PaidAmount) : (inv.Amount || 150000000);
                inv.PaidAmount = paidVal;
                inv.Status = inputs.Status || (paidVal >= inv.Amount ? 'PAID' : 'PARTIALLY_PAID');
              }
              return { recordset: [] };
            }
            let invs = [...memoryDb.invoices];
            if (inputs.InvoiceID || inputs.invoiceid) {
              const targetId = inputs.InvoiceID || inputs.invoiceid;
              invs = invs.filter(i => i.InvoiceID == targetId);
            } else if (inputs.BuyerCompanyID) {
              invs = invs.filter(i => i.BuyerCompanyID == inputs.BuyerCompanyID);
            }
            return { recordset: invs };
          }

          // 6. Orders
          if (q.includes('orders')) {
            let ords = [...memoryDb.orders];
            if (inputs.CompanyID || inputs.BuyerCompanyID) {
              const cid = inputs.CompanyID || inputs.BuyerCompanyID;
              ords = ords.filter(o => o.BuyerCompanyID == cid);
            }
            return { recordset: ords };
          }

          // 7. RFQs
          if (q.includes('insert into rfqs') || q.includes('rfqs')) {
            if (q.includes('insert')) {
              const newId = 5000 + memoryDb.rfqs.length + 1;
              const newRfq = {
                rfq_id: newId,
                RFQID: newId,
                BuyerCompanyID: inputs.BuyerCompanyID || 1,
                title: inputs.Title || 'RFQ Mua Sỉ Rượu',
                product_name: inputs.ProductName || inputs.Description || 'Hennessy XO',
                quantity: inputs.RequestedQuantity || 10,
                target_price: inputs.TargetPrice || inputs.TargetUnitPrice || 45000000,
                buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
                status: 'SUBMITTED',
                created_at: new Date().toISOString()
              };
              memoryDb.rfqs.push(newRfq);
              return { recordset: [{ RFQID: newId, CreatedAt: new Date() }] };
            }
            return { recordset: memoryDb.rfqs.map(r => ({ ...r, RFQID: r.rfq_id || r.RFQID, BuyerCompany: r.buyer_company })) };
          }

          // 8. Quotations
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
              return { recordset: [{ QuotationID: newId, CreatedAt: new Date() }] };
            }
            return { recordset: memoryDb.quotations };
          }

          // 9. LCDocuments
          if (q.includes('lcdocuments')) {
            if (q.includes('insert')) {
              const newId = Math.floor(7000 + Math.random() * 100000);
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
            let docs = memoryDb.lcDocuments;
            if (inputs.LCID) {
              docs = docs.filter(x => x.LCID == inputs.LCID);
            }
            return { recordset: docs };
          }

          // 10. RFQMessages (Chatbot & AI Sommelier Channel Messages)
          if (q.includes('rfqmessages')) {
            if (q.includes('insert')) {
              const newId = memoryDb.rfqMessages.length + 1;
              const newMsg = {
                MessageID: newId,
                RFQID: inputs.RFQID || 999,
                SenderName: inputs.SenderName || 'Khách hàng',
                SenderRole: inputs.SenderRole || 'BUYER',
                MessageText: inputs.MessageText || '',
                CreatedAt: new Date()
              };
              memoryDb.rfqMessages.push(newMsg);
              return { recordset: [{ MessageID: newId }] };
            }
            let msgs = memoryDb.rfqMessages;
            if (inputs.RFQID) {
              msgs = msgs.filter(m => m.RFQID == inputs.RFQID);
            }
            return { recordset: msgs };
          }


          // 12. Shipments Persistence
          if (q.includes('shipments')) {
            if (!memoryDb.shipments) {
              memoryDb.shipments = [
                { ShipmentID: 701, TrackingNumber: 'GHN-8842-VN', OrderNumber: 'ORD-2026-8842', buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', Carrier: 'Giao Hàng Nhanh (GHN)', ShipmentStatus: 'IN_TRANSIT', EstimatedDeliveryDate: new Date('2026-08-10') },
                { ShipmentID: 702, TrackingNumber: 'VT-8821-VN', OrderNumber: 'ORD-2026-8821', buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', Carrier: 'Viettel Post', ShipmentStatus: 'DELIVERED', EstimatedDeliveryDate: new Date('2026-07-20') }
              ];
            }
            if (q.includes('insert')) {
              const newId = 700 + memoryDb.shipments.length + 1;
              const newShipment = {
                ShipmentID: newId,
                TrackingNumber: `GHN-${Date.now().toString().slice(-6)}-VN`,
                OrderNumber: inputs.OrderNumber || 'ORD-2026-8842',
                buyer_company: inputs.BuyerCompany || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
                Carrier: inputs.Carrier || 'Giao Hàng Nhanh (GHN)',
                ShipmentStatus: 'PICKING',
                EstimatedDeliveryDate: inputs.EstimatedDeliveryDate ? new Date(inputs.EstimatedDeliveryDate) : new Date()
              };
              memoryDb.shipments.push(newShipment);
              return { recordset: [{ ShipmentID: newId }] };
            }
            if (q.includes('update')) {
              const shipId = inputs.ShipmentID || inputs.id;
              const ship = memoryDb.shipments.find(x => x.ShipmentID == shipId);
              if (ship && inputs.Status) {
                ship.ShipmentStatus = inputs.Status;
              }
              return { recordset: [] };
            }
            return { recordset: memoryDb.shipments };
          }

          // 13. Companies & Licenses
          if (q.includes('companylicenses')) return { recordset: memoryDb.licenses };
          if (q.includes('companies')) return { recordset: memoryDb.companies };

          return { recordset: [] };
        }
      };
      return reqObj;
    }
  };
  return poolObj;
};

// Safe Transaction class override for Cloud Mock Mode
const OriginalTransaction = sql.Transaction;
function CustomTransaction(pool) {
  if (pool && pool.isMock) {
    this.begin = async () => {};
    this.commit = async () => {};
    this.rollback = async () => {};
    this.request = () => pool.request();
    return this;
  }
  return new OriginalTransaction(pool);
}
sql.Transaction = CustomTransaction;

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
