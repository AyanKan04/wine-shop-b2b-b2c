// Seed script to insert REAL B2B Orders, Invoices, and CreditLimits into MS SQL Server DB
const { getPool, sql } = require('./src/config/db');

async function seedRealInvoices() {
  console.log('===========================================================');
  console.log('📦 SEEDING REAL B2B INVOICES & CREDIT LIMITS INTO MS SQL SERVER DB');
  console.log('===========================================================');

  try {
    const pool = await getPool();

    // 1. Ensure Buyer Companies exist in DB
    const buyerCompanies = [
      { name: 'Công Ty TNHH Lotte Mart Việt Nam', code: 'COMP-LOTTE-01', tax: '0309988771' },
      { name: 'Tập Đoàn WinCommerce (WinMart)', code: 'COMP-WINMART-02', tax: '0108877662' },
      { name: 'Hệ Thống Siêu Thị Central Retail', code: 'COMP-CENTRAL-03', tax: '0311223344' },
      { name: 'Liên Hiệp Hợp Tác Xã Saigon Co.op', code: 'COMP-SAIGONCOOP-04', tax: '0301445566' }
    ];

    const companyIds = [];
    for (const comp of buyerCompanies) {
      let check = await pool.request()
        .input('TaxCode', sql.NVarChar, comp.tax)
        .input('CompanyCode', sql.NVarChar, comp.code)
        .query('SELECT CompanyID FROM Companies WHERE TaxCode = @TaxCode OR CompanyCode = @CompanyCode');
      
      let compId;
      if (check.recordset.length === 0) {
        const ins = await pool.request()
          .input('CompanyName', sql.NVarChar, comp.name)
          .input('CompanyCode', sql.NVarChar, comp.code)
          .input('TaxCode', sql.NVarChar, comp.tax)
          .query("INSERT INTO Companies (CompanyName, CompanyCode, TaxCode, CompanyType, Status) OUTPUT INSERTED.CompanyID VALUES (@CompanyName, @CompanyCode, @TaxCode, 'BUYER', 'ACTIVE')");
        compId = ins.recordset[0].CompanyID;
        console.log(`✅ Created Buyer Company: ${comp.name} (ID: ${compId})`);
      } else {
        compId = check.recordset[0].CompanyID;
        console.log(`ℹ️ Existing Buyer Company: ${comp.name} (ID: ${compId})`);
      }
      companyIds.push(compId);

      // Ensure Credit Limit record in CreditLimits table
      await pool.request()
        .input('CompanyID', sql.BigInt, compId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM CreditLimits WHERE CompanyID = @CompanyID)
          BEGIN
            INSERT INTO CreditLimits (CompanyID, CreditLimitAmount, UsedAmount)
            VALUES (@CompanyID, 1000000000, 270000000);
          END
        `);
    }

    // 2. Ensure Admin User Company Credit Limit
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM CreditLimits WHERE CompanyID = 1)
      BEGIN
        INSERT INTO CreditLimits (CompanyID, CreditLimitAmount, UsedAmount)
        VALUES (1, 1000000000, 270000000);
      END
    `);

    // 3. Create Real B2B Orders and Invoices in DB
    const invoicesToSeed = [
      { orderNum: 'ORD-2026-8801', invNum: 'INV-2026-001', amount: 25000000, companyIdx: 0, status: 'UNPAID', daysAgo: 5, dueDays: 25 },
      { orderNum: 'ORD-2026-8802', invNum: 'INV-2026-002', amount: 45000000, companyIdx: 1, status: 'UNPAID', daysAgo: 10, dueDays: 20 },
      { orderNum: 'ORD-2026-8803', invNum: 'INV-2026-003', amount: 80000000, companyIdx: 2, status: 'UNPAID', daysAgo: 15, dueDays: 15 },
      { orderNum: 'ORD-2026-8804', invNum: 'INV-2026-004', amount: 120000000, companyIdx: 3, status: 'UNPAID', daysAgo: 2, dueDays: 28 },
      { orderNum: 'ORD-2026-8805', invNum: 'INV-2026-005', amount: 35000000, companyIdx: 0, status: 'PARTIALLY_PAID', paidAmount: 15000000, daysAgo: 20, dueDays: 10 }
    ];

    let insertedCount = 0;
    for (const inv of invoicesToSeed) {
      const bCompId = companyIds[inv.companyIdx] || companyIds[0];

      // Insert Order if not exist
      let orderCheck = await pool.request()
        .input('OrderNumber', sql.NVarChar, inv.orderNum)
        .query('SELECT OrderID FROM Orders WHERE OrderNumber = @OrderNumber');
      
      let orderId;
      if (orderCheck.recordset.length === 0) {
        const insOrd = await pool.request()
          .input('BuyerCompanyID', sql.BigInt, bCompId)
          .input('OrderNumber', sql.NVarChar, inv.orderNum)
          .input('TotalAmount', sql.Decimal(18,2), inv.amount)
          .input('daysAgo', sql.Int, inv.daysAgo)
          .query("INSERT INTO Orders (BuyerCompanyID, OrderNumber, TotalAmount, OrderStatus, PaymentMethod, CreatedAt) OUTPUT INSERTED.OrderID VALUES (@BuyerCompanyID, @OrderNumber, @TotalAmount, 'DELIVERED', 'Net-30 Credit', DATEADD(day, -@daysAgo, GETDATE()))");
        orderId = insOrd.recordset[0].OrderID;
      } else {
        orderId = orderCheck.recordset[0].OrderID;
      }

      // Insert Invoice if not exist
      let invCheck = await pool.request()
        .input('InvoiceNumber', sql.NVarChar, inv.invNum)
        .query('SELECT InvoiceID FROM Invoices WHERE InvoiceNumber = @InvoiceNumber');

      if (invCheck.recordset.length === 0) {
        await pool.request()
          .input('OrderID', sql.BigInt, orderId)
          .input('InvoiceNumber', sql.NVarChar, inv.invNum)
          .input('Amount', sql.Decimal(18,2), inv.amount)
          .input('PaidAmount', sql.Decimal(18,2), inv.paidAmount || 0)
          .input('Status', sql.NVarChar, inv.status)
          .query(`
            INSERT INTO Invoices (OrderID, InvoiceNumber, InvoiceDate, DueDate, Amount, PaidAmount, Status)
            VALUES (@OrderID, @InvoiceNumber, DATEADD(day, -5, GETDATE()), DATEADD(day, 25, GETDATE()), @Amount, @PaidAmount, @Status)
          `);
        insertedCount++;
        console.log(`✅ Inserted Invoice: ${inv.invNum} (${inv.amount.toLocaleString()} đ) for Order ${inv.orderNum}`);
      } else {
        console.log(`ℹ️ Existing Invoice: ${inv.invNum}`);
      }
    }

    // Update UsedAmount in CreditLimits based on unpaid invoices
    await pool.request().query(`
      UPDATE cl
      SET UsedAmount = ISNULL((
        SELECT SUM(i.Amount - ISNULL(i.PaidAmount, 0))
        FROM Invoices i
        JOIN Orders o ON i.OrderID = o.OrderID
        WHERE o.BuyerCompanyID = cl.CompanyID AND i.Status != 'PAID'
      ), 0)
      FROM CreditLimits cl
    `);

    console.log('\n===========================================================');
    console.log(`🎉 SUCCESS: ${insertedCount} REAL B2B INVOICES SEEDED INTO MS SQL SERVER DATABASE!`);
    console.log('===========================================================');
    process.exit(0);

  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
}

seedRealInvoices();
