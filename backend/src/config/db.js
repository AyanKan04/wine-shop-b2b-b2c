// Database Configuration & MS SQL Server Persistent Sync Engine
const sql = require('mssql/msnodesqlv8');
const { seedIfEmpty } = require('./dbSeeder');

const config = {
  connectionString: process.env.DATABASE_URL || 'Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-BFLA0CO\\SQLEXPRESS;Database=B2B_Alcohol_Ecommerce;Trusted_Connection=yes;'
};

let isConnected = false;

// In-Memory Database Store (Kept in-sync with MS SQL Server)
const dbMock = {
  companies: [],
  licenses: [],
  products: [],
  rfqs: [],
  rfq_messages: [
    {
      message_id: 1,
      rfq_id: 8842,
      sender_name: 'Platform Sales Bot',
      sender_role: 'SYSTEM',
      message_text: 'Hệ thống đã nhận RFQ. Sommelier AI & Sales Rep đang kiểm tra thông tin hàng hóa.',
      created_at: '2026-07-28 20:30'
    }
  ],
  quotations: [],
  orders: [],
  invoices: [],
  credit_limit: {
    total_limit: 1000000000,
    used_amount: 350000000,
    available_balance: 650000000
  },
  inventory: [],
  shipments: [],
  lc_documents: [],
  activity_logs: [
    { id: 'ACT-001', timestamp: '2026-07-28 20:25', module: 'CRM', action: 'Chuyển DEAL-101 sang Đang Đàm Phán', actor: 'Sales Admin', icon: 'fa-square-kanban', color: '#F59E0B' },
    { id: 'ACT-002', timestamp: '2026-07-28 19:40', module: 'Finance', action: 'Thanh toán hóa đơn INV-2026-0091 thành công', actor: 'Kế Toán', icon: 'fa-receipt', color: '#10B981' },
    { id: 'ACT-003', timestamp: '2026-07-28 18:15', module: 'Warehouse', action: 'Xuất kho 20 thùng Macallan 18 cho ORD-2026-8821', actor: 'Warehouse Staff', icon: 'fa-boxes-stacked', color: '#3B82F6' },
    { id: 'ACT-004', timestamp: '2026-07-28 17:00', module: 'Admin', action: 'Phê duyệt giấy phép rượu LIC-001 cho LOTTE SAIGON', actor: 'Platform Admin', icon: 'fa-shield-halved', color: '#E54D60' }
  ],
  notifications: [
    { id: 'NOTIF-001', type: 'warning', title: 'Hóa đơn sắp đến hạn', message: 'INV-2026-0104 đến hạn ngày 20/08/2026 (còn 23 ngày)', read: false, timestamp: '2026-07-28 20:00' },
    { id: 'NOTIF-002', type: 'info', title: 'RFQ mới từ CONTINENTAL', message: 'Yêu cầu báo giá 40 thùng Château Margaux 2018', read: false, timestamp: '2026-07-28 19:30' }
  ],
  revenue_data: {
    monthly: [
      { month: 'T1', revenue: 8200000000, orders: 12 },
      { month: 'T2', revenue: 9500000000, orders: 15 },
      { month: 'T3', revenue: 7800000000, orders: 11 },
      { month: 'T4', revenue: 11200000000, orders: 18 },
      { month: 'T5', revenue: 13500000000, orders: 22 },
      { month: 'T6', revenue: 15800000000, orders: 25 },
      { month: 'T7', revenue: 18650000000, orders: 30 }
    ],
    top_products: [
      { name: 'Macallan 18', revenue: 6800000000, percentage: 36 },
      { name: 'Château Margaux', revenue: 4400000000, percentage: 24 },
      { name: 'Dom Pérignon', revenue: 3000000000, percentage: 16 },
      { name: 'Hennessy X.O', revenue: 2700000000, percentage: 14 },
      { name: 'Khác', revenue: 1750000000, percentage: 10 }
    ]
  }
};

// Establish connection to SQL Server & Sync DB State
async function connectDB() {
  try {
    console.log('Connecting to MS SQL Server database...');
    await sql.connect(config);
    isConnected = true;
    console.log('SUCCESSFULLY connected to MS SQL Server (Windows Auth)');

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
    } catch (lcTableErr) {
      console.error('Failed to create LCDocuments table:', lcTableErr.message);
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

    // 4. Load tables into memory dbMock
    await loadFromSQLServer();

  } catch (err) {
    console.error('DATABASE connection or initialization failed:', err.message);
  }
}

// Load data from SQL Server tables and map them to dbMock objects
async function loadFromSQLServer() {
  if (!isConnected) return;
  console.log('Synchronizing RAM dbMock from SQL Server database...');
  try {
    // 1. Companies
    const compRes = await sql.query`SELECT * FROM Companies`;
    dbMock.companies = compRes.recordset.map(row => ({
      company_id: Number(row.CompanyID),
      company_code: row.CompanyCode,
      company_name: row.CompanyName,
      tax_code: row.TaxCode,
      company_type: row.CompanyType,
      status: row.Status || 'PENDING',
      website: row.Website || '',
      created_at: row.CreatedAt ? row.CreatedAt.toISOString().slice(0, 10) : ''
    }));

    // 2. Company Licenses
    const licRes = await sql.query`SELECT * FROM CompanyLicenses`;
    dbMock.licenses = licRes.recordset.map(row => ({
      license_id: Number(row.LicenseID),
      company_id: Number(row.CompanyID),
      company_name: dbMock.companies.find(c => c.company_id === Number(row.CompanyID))?.company_name || 'Doanh Nghiệp',
      license_type: row.LicenseType,
      license_number: row.LicenseNumber,
      issue_date: row.IssueDate ? row.IssueDate.toISOString().slice(0, 10) : '',
      expiry_date: row.ExpiryDate ? row.ExpiryDate.toISOString().slice(0, 10) : '',
      document_url: row.DocumentUrl || '',
      status: row.Status || 'PENDING_VERIFICATION'
    }));

    // 3. Products & Tier Prices
    const prodRes = await sql.query`
      SELECT p.*, c.CategoryName 
      FROM Products p 
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
    `;
    const priceRes = await sql.query`SELECT * FROM ProductTierPrices ORDER BY ProductID, TierLevel`;

    dbMock.products = prodRes.recordset.map(row => {
      const tier_prices = priceRes.recordset
        .filter(tp => tp.ProductID === row.ProductID)
        .map(tp => ({
          tier_level: tp.TierLevel,
          min_quantity: tp.MinQuantity,
          price_per_unit: Number(tp.PricePerUnit)
        }));

      return {
        product_id: Number(row.ProductID),
        sku: row.SKU,
        product_name: row.ProductName,
        category: row.CategoryName || 'Fine Wine',
        country_of_origin: row.CountryOfOrigin || '',
        alcohol_content: row.AlcoholContent ? Number(row.AlcoholContent) : 13.0,
        volume_ml: row.VolumeML || 750,
        moq: row.MOQ || 1,
        image_url: row.image_url || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
        description: row.Description || '',
        tier_prices
      };
    });

    // 4. Inventories
    const invRes = await sql.query`
      SELECT i.*, p.ProductName, p.SKU, p.Description 
      FROM Inventories i
      JOIN Products p ON i.ProductID = p.ProductID
    `;
    dbMock.inventory = invRes.recordset.map(row => ({
      product_id: Number(row.ProductID),
      sku: row.SKU,
      product_name: row.ProductName,
      stock_on_hand: row.QuantityOnHand || 0,
      reserved: row.ReservedQuantity || 0,
      min_stock_level: 10,
      location: 'Kho A1 - Quận 7'
    }));

    // 5. Credit Limit
    const creditRes = await sql.query`SELECT * FROM CreditLimits WHERE CompanyID = 1`;
    if (creditRes.recordset.length > 0) {
      const row = creditRes.recordset[0];
      dbMock.credit_limit = {
        total_limit: Number(row.CreditLimitAmount),
        used_amount: Number(row.UsedAmount),
        available_balance: Number(row.AvailableAmount || (row.CreditLimitAmount - row.UsedAmount))
      };
    }

    // 6. Orders
    const ordRes = await sql.query`
      SELECT o.*, c.CompanyName 
      FROM Orders o
      LEFT JOIN Companies c ON o.BuyerCompanyID = c.CompanyID
    `;
    dbMock.orders = ordRes.recordset.map(row => ({
      order_id: Number(row.OrderID),
      order_number: row.OrderNumber,
      buyer_company: row.CompanyName || 'LOTTE SAIGON',
      total_amount: Number(row.TotalAmount),
      order_status: row.OrderStatus || 'PENDING',
      payment_method: row.PaymentMethod || 'NET_30_CREDIT',
      payment_status: 'UNPAID', // Set below from invoice status
      created_at: row.CreatedAt ? row.CreatedAt.toISOString().slice(0, 10) : ''
    }));

    // 7. Invoices
    const invcRes = await sql.query`
      SELECT i.*, o.OrderNumber 
      FROM Invoices i
      LEFT JOIN Orders o ON i.OrderID = o.OrderID
    `;
    dbMock.invoices = invcRes.recordset.map(row => {
      // Sync payment status to order
      const matchOrder = dbMock.orders.find(o => o.order_number === row.OrderNumber);
      if (matchOrder) {
        matchOrder.payment_status = row.Status || 'UNPAID';
      }

      return {
        invoice_id: Number(row.InvoiceID),
        invoice_number: row.InvoiceNumber,
        order_number: row.OrderNumber,
        issue_date: row.InvoiceDate ? row.InvoiceDate.toISOString().slice(0, 10) : '',
        due_date: row.DueDate ? row.DueDate.toISOString().slice(0, 10) : '',
        amount: Number(row.Amount),
        status: row.Status || 'UNPAID'
      };
    });

    // 8. Shipments
    const shipRes = await sql.query`
      SELECT s.*, o.OrderNumber, c.CompanyName 
      FROM Shipments s
      LEFT JOIN Orders o ON s.OrderID = o.OrderID
      LEFT JOIN Companies c ON o.BuyerCompanyID = c.CompanyID
    `;
    dbMock.shipments = shipRes.recordset.map(row => ({
      shipment_id: Number(row.ShipmentID),
      order_id: row.OrderID ? Number(row.OrderID) : null,
      order_number: row.OrderNumber || '',
      buyer_company: row.CompanyName || 'LOTTE SAIGON',
      tracking_number: row.TrackingNumber || '',
      carrier: 'Viettel Post',
      shipment_status: row.ShipmentStatus || 'PICKING',
      items_summary: 'Chi tiết sỉ rượu sỉ',
      pickup_date: row.EstimatedDeliveryDate ? row.EstimatedDeliveryDate.toISOString().slice(0, 10) : '',
      estimated_delivery: row.EstimatedDeliveryDate ? row.EstimatedDeliveryDate.toISOString().slice(0, 10) : '',
      actual_delivery: row.ShipmentStatus === 'DELIVERED' ? row.UpdatedAt || new Date().toISOString().slice(0,10) : null,
      delivery_note_url: row.DeliveryNoteUrl || '',
      created_at: new Date().toISOString().slice(0, 10)
    }));

    // 9. RFQs
    const rfqRes = await sql.query`
      SELECT r.*, c.CompanyName 
      FROM RFQs r
      LEFT JOIN Companies c ON r.BuyerCompanyID = c.CompanyID
    `;
    dbMock.rfqs = rfqRes.recordset.map(row => ({
      rfq_id: Number(row.RFQID),
      buyer_company: row.CompanyName || 'LOTTE SAIGON',
      title: row.Title,
      product_name: 'Macallan 18 Year Old Sherry Oak Single Malt',
      quantity: 150,
      target_price: 68000000,
      status: row.Status || 'SUBMITTED',
      created_at: row.CreatedAt ? row.CreatedAt.toISOString().slice(0, 10) : ''
    }));

    // 10. Quotations
    const quotRes = await sql.query`
      SELECT q.*, c.CompanyName as BuyerCompanyName 
      FROM Quotations q
      LEFT JOIN Companies c ON q.BuyerCompanyID = c.CompanyID
    `;
    dbMock.quotations = quotRes.recordset.map(row => ({
      quotation_id: Number(row.QuotationID),
      rfq_id: Number(row.RFQID),
      buyer_company: row.BuyerCompanyName || 'LOTTE SAIGON',
      seller_company: 'MAISON DE L\'ALCOOL RED APRON FACTORY',
      offer_unit_price: 68500000,
      quantity: 150,
      valid_until: row.ValidUntil ? row.ValidUntil.toISOString().slice(0, 10) : '',
      status: row.Status || 'PENDING'
    }));

    // 11. L/C Documents
    try {
      const lcRes = await sql.query`SELECT * FROM LCDocuments`;
      dbMock.lc_documents = lcRes.recordset.map(row => ({
        lc_id: Number(row.LCID),
        buyer_company: row.BuyerCompany,
        lc_number: row.LCNumber,
        issuing_bank: row.IssuingBank,
        amount: Number(row.Amount),
        expiry_date: row.ExpiryDate ? row.ExpiryDate.toISOString().slice(0, 10) : '',
        document_url: row.DocumentUrl,
        status: row.Status || 'SUBMITTED',
        created_at: row.CreatedAt ? row.CreatedAt.toISOString().slice(0, 10) : ''
      }));
    } catch (lcErr) {
      console.warn('Could not load LCDocuments table:', lcErr.message);
    }

    console.log(`Database sync completed! Loaded: ${dbMock.products.length} products, ${dbMock.orders.length} orders, ${dbMock.companies.length} companies, ${dbMock.lc_documents.length} L/C documents.`);
  } catch (err) {
    console.error('Error loading SQL Server tables into memory:', err.message);
  }
}

// ==============================================================================
// RUNTIME WRITE PERSISTENCE METHODS (Write-Through to SQL Server)
// ==============================================================================

async function persistUser(user) {
  if (!isConnected) return;
  try {
    await sql.query`
      INSERT INTO Users (CompanyID, Email, Username, PasswordHash, UserType, Status, CreatedAt, UpdatedAt)
      VALUES (${user.company_id || 1}, ${user.email}, ${user.username}, ${user.password_hash || user.password}, 'BUYER_REP', 'ACTIVE', GETDATE(), GETDATE())
    `;
    console.log(`Persisted User registration to SQL Server: ${user.username}`);
  } catch (err) {
    console.error('Failed to persist User to SQL Server:', err.message);
  }
}

async function persistProduct(prod) {
  if (!isConnected) return;
  try {
    // 1. Insert product
    const request = new sql.Request();
    request.input('sku', sql.NVarChar, prod.sku);
    request.input('name', sql.NVarChar, prod.product_name);
    request.input('desc', sql.NVarChar, prod.description || '');
    request.input('country', sql.NVarChar, prod.country_of_origin || 'France');
    request.input('abv', sql.Decimal(5, 2), prod.alcohol_content || 13.0);
    request.input('vol', sql.Int, prod.volume_ml || 750);
    request.input('moq', sql.Int, prod.moq || 5);

    const result = await request.query`
      INSERT INTO Products (SellerCompanyID, BrandID, CategoryID, SKU, ProductName, Slug, Description, CountryOfOrigin, AlcoholContent, VolumeML, MOQ, Status, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.ProductID
      VALUES (2, 1, 1, @sku, @name, @sku, @desc, @country, @abv, @vol, @moq, 'ACTIVE', GETDATE(), GETDATE())
    `;
    const newId = result.recordset[0].ProductID;
    prod.product_id = newId;

    // 2. Insert tier prices
    if (prod.tier_prices && prod.tier_prices.length > 0) {
      for (const tp of prod.tier_prices) {
        await sql.query`
          INSERT INTO ProductTierPrices (ProductID, TierLevel, MinQuantity, PricePerUnit)
          VALUES (${newId}, ${tp.tier_level}, ${tp.min_quantity}, ${tp.price_per_unit})
        `;
      }
    }

    // 3. Insert inventory
    await sql.query`
      INSERT INTO Inventories (ProductID, QuantityOnHand, ReservedQuantity)
      VALUES (${newId}, 0, 0)
    `;

    console.log(`Persisted Product + Prices + Inventory to SQL Server: ${prod.product_name} (ID: ${newId})`);
  } catch (err) {
    console.error('Failed to persist Product to SQL Server:', err.message);
  }
}

async function persistLicense(lic) {
  if (!isConnected) return;
  try {
    await sql.query`
      INSERT INTO CompanyLicenses (CompanyID, LicenseType, LicenseNumber, IssueDate, ExpiryDate, DocumentUrl, Status)
      VALUES (${lic.company_id || 1}, ${lic.license_type}, ${lic.license_number}, ${lic.issue_date}, ${lic.expiry_date}, ${lic.document_url}, ${lic.status || 'PENDING_VERIFICATION'})
    `;
    console.log(`Persisted Company License to SQL Server: ${lic.license_number}`);
  } catch (err) {
    console.error('Failed to persist License to SQL Server:', err.message);
  }
}

async function updateLicenseStatus(licId, status) {
  if (!isConnected) return;
  try {
    await sql.query`
      UPDATE CompanyLicenses 
      SET Status = ${status} 
      WHERE LicenseID = ${licId}
    `;
    console.log(`Updated License status in SQL Server: LicenseID ${licId} -> ${status}`);
  } catch (err) {
    console.error('Failed to update License status in SQL Server:', err.message);
  }
}

async function persistRFQ(rfq) {
  if (!isConnected) return;
  try {
    const result = await sql.query`
      INSERT INTO RFQs (BuyerCompanyID, CreatedBy, Title, Description, Status, CreatedAt)
      OUTPUT INSERTED.RFQID
      VALUES (1, 1, ${rfq.title}, ${rfq.product_name}, 'SUBMITTED', GETDATE())
    `;
    const newId = result.recordset[0].RFQID;
    rfq.rfq_id = newId;

    // Add rfq item
    await sql.query`
      INSERT INTO RFQItems (RFQID, ProductID, Quantity, TargetPrice)
      VALUES (${newId}, 101, ${rfq.quantity}, ${rfq.target_price})
    `;

    console.log(`Persisted RFQ to SQL Server: ID ${newId}`);
  } catch (err) {
    console.error('Failed to persist RFQ to SQL Server:', err.message);
  }
}

async function persistQuotation(q) {
  if (!isConnected) return;
  try {
    const result = await sql.query`
      INSERT INTO Quotations (RFQID, BuyerCompanyID, SellerCompanyID, CreatedBy, Status, ValidUntil, CreatedAt)
      OUTPUT INSERTED.QuotationID
      VALUES (${q.rfq_id}, 1, 2, 1, 'PENDING', ${q.valid_until || '2026-12-31'}, GETDATE())
    `;
    const newId = result.recordset[0].QuotationID;
    q.quotation_id = newId;

    // Add quotation item
    await sql.query`
      INSERT INTO QuotationItems (QuotationID, ProductID, Quantity, OfferUnitPrice)
      VALUES (${newId}, 101, ${q.quantity}, ${q.offer_unit_price})
    `;

    console.log(`Persisted Quotation to SQL Server: ID ${newId}`);
  } catch (err) {
    console.error('Failed to persist Quotation to SQL Server:', err.message);
  }
}

async function updateQuotationStatus(qId, status) {
  if (!isConnected) return;
  try {
    await sql.query`
      UPDATE Quotations 
      SET Status = ${status} 
      WHERE QuotationID = ${qId}
    `;
    console.log(`Updated Quotation status: QuotationID ${qId} -> ${status}`);
  } catch (err) {
    console.error('Failed to update Quotation status in SQL Server:', err.message);
  }
}

async function persistOrder(ord) {
  if (!isConnected) return;
  try {
    const result = await sql.query`
      INSERT INTO Orders (BuyerCompanyID, SellerCompanyID, QuotationID, OrderNumber, OrderStatus, PaymentMethod, TotalAmount, CreatedBy, CreatedAt)
      OUTPUT INSERTED.OrderID
      VALUES (1, 2, ${ord.quotation_id || null}, ${ord.order_number}, ${ord.order_status || 'PENDING'}, ${ord.payment_method || 'NET_30_CREDIT'}, ${ord.total_amount}, 1, GETDATE())
    `;
    const newId = result.recordset[0].OrderID;
    ord.order_id = newId;

    // Add order item
    await sql.query`
      INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice)
      VALUES (${newId}, 101, 10, ${ord.total_amount})
    `;

    console.log(`Persisted Order to SQL Server: ID ${newId}`);
  } catch (err) {
    console.error('Failed to persist Order to SQL Server:', err.message);
  }
}

async function persistInvoice(inv) {
  if (!isConnected) return;
  try {
    // Find order id first
    const orderRes = await sql.query`SELECT OrderID FROM Orders WHERE OrderNumber = ${inv.order_number}`;
    const orderId = orderRes.recordset.length > 0 ? orderRes.recordset[0].OrderID : null;

    const result = await sql.query`
      INSERT INTO Invoices (OrderID, InvoiceNumber, InvoiceDate, DueDate, Status, Amount)
      OUTPUT INSERTED.InvoiceID
      VALUES (${orderId}, ${inv.invoice_number}, ${inv.issue_date}, ${inv.due_date}, ${inv.status}, ${inv.amount})
    `;
    inv.invoice_id = result.recordset[0].InvoiceID;
    console.log(`Persisted Invoice to SQL Server: ID ${inv.invoice_id}`);
  } catch (err) {
    console.error('Failed to persist Invoice to SQL Server:', err.message);
  }
}

async function updateInvoiceStatus(invId, status) {
  if (!isConnected) return;
  try {
    await sql.query`
      UPDATE Invoices 
      SET Status = ${status} 
      WHERE InvoiceID = ${invId}
    `;
    console.log(`Updated Invoice status: InvoiceID ${invId} -> ${status}`);
  } catch (err) {
    console.error('Failed to update Invoice status in SQL Server:', err.message);
  }
}

async function updateCreditLimit(cl) {
  if (!isConnected) return;
  try {
    await sql.query`
      UPDATE CreditLimits 
      SET CreditLimitAmount = ${cl.total_limit}, UsedAmount = ${cl.used_amount}, AvailableAmount = ${cl.available_balance}
      WHERE CompanyID = 1
    `;
    console.log('Updated Credit Limit in SQL Server for Company 1');
  } catch (err) {
    console.error('Failed to update Credit Limit in SQL Server:', err.message);
  }
}

async function persistShipment(ship) {
  if (!isConnected) return;
  try {
    const orderRes = await sql.query`SELECT OrderID FROM Orders WHERE OrderNumber = ${ship.order_number}`;
    const orderId = orderRes.recordset.length > 0 ? orderRes.recordset[0].OrderID : null;

    const result = await sql.query`
      INSERT INTO Shipments (OrderID, TrackingNumber, ShipmentStatus, EstimatedDeliveryDate, DeliveryNoteUrl)
      OUTPUT INSERTED.ShipmentID
      VALUES (${orderId}, ${ship.tracking_number}, ${ship.shipment_status}, ${ship.estimated_delivery}, ${ship.delivery_note_url || null})
    `;
    ship.shipment_id = result.recordset[0].ShipmentID;
    console.log(`Persisted Shipment to SQL Server: ID ${ship.shipment_id}`);
  } catch (err) {
    console.error('Failed to persist Shipment to SQL Server:', err.message);
  }
}

async function updateShipmentStatus(shipId, status) {
  if (!isConnected) return;
  try {
    await sql.query`
      UPDATE Shipments 
      SET ShipmentStatus = ${status} 
      WHERE ShipmentID = ${shipId}
    `;
    console.log(`Updated Shipment status: ShipmentID ${shipId} -> ${status}`);
  } catch (err) {
    console.error('Failed to update Shipment status in SQL Server:', err.message);
  }
}

async function persistInventory(inv) {
  if (!isConnected) return;
  try {
    await sql.query`
      UPDATE Inventories 
      SET QuantityOnHand = ${inv.stock_on_hand}, ReservedQuantity = ${inv.reserved}
      WHERE ProductID = ${inv.product_id}
    `;
    console.log(`Updated Inventory in SQL Server for ProductID: ${inv.product_id}`);
  } catch (err) {
    console.error('Failed to update Inventory in SQL Server:', err.message);
  }
}

async function persistLC(lc) {
  if (!isConnected) return;
  try {
    const result = await sql.query`
      INSERT INTO LCDocuments (BuyerCompany, LCNumber, IssuingBank, Amount, ExpiryDate, DocumentUrl, Status, CreatedAt)
      OUTPUT INSERTED.LCID
      VALUES (${lc.buyer_company || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON'}, ${lc.lc_number}, ${lc.issuing_bank}, ${lc.amount}, ${lc.expiry_date}, ${lc.document_url}, 'SUBMITTED', GETDATE())
    `;
    lc.lc_id = result.recordset[0].LCID;
    console.log(`Persisted L/C document to SQL Server: ID ${lc.lc_id}`);
  } catch (err) {
    console.error('Failed to persist L/C to SQL Server:', err.message);
  }
}

async function updateLCStatus(lcId, status) {
  if (!isConnected) return;
  try {
    await sql.query`
      UPDATE LCDocuments 
      SET Status = ${status} 
      WHERE LCID = ${lcId}
    `;
    console.log(`Updated L/C status in SQL Server: LCID ${lcId} -> ${status}`);
  } catch (err) {
    console.error('Failed to update L/C status in SQL Server:', err.message);
  }
}

// Start database connection
connectDB();

module.exports = {
  sql,
  dbMock,
  // Persistence bridges
  persistUser,
  persistProduct,
  persistLicense,
  updateLicenseStatus,
  persistRFQ,
  persistQuotation,
  updateQuotationStatus,
  persistOrder,
  persistInvoice,
  updateInvoiceStatus,
  updateCreditLimit,
  persistShipment,
  updateShipmentStatus,
  persistInventory,
  persistLC,
  updateLCStatus
};
