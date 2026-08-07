const { getPool, sql } = require('../config/db');

// RFQs API
const getRFQs = async (req, res) => {
  try {
    const pool = await getPool();
    // Query RFQs along with their items and Product information using LEFT JOIN
    const result = await pool.request().query(`
      SELECT r.*, c.CompanyName as buyer_company, p.ProductName as db_product_name,
             (SELECT * FROM RFQItems ri WHERE ri.RFQID = r.RFQID FOR JSON PATH) as items
      FROM RFQs r
      LEFT JOIN Companies c ON r.BuyerCompanyID = c.CompanyID
      LEFT JOIN Products p ON r.ProductID = p.ProductID
      ORDER BY r.CreatedAt DESC
    `);
    
    const rfqs = result.recordset.map(row => {
      let items = [];
      if (row.items) {
        items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
      }
      return {
        rfq_id: row.RFQID,
        buyer_company: row.buyer_company,
        title: row.Title,
        product_name: row.db_product_name || row.Description || 'Sản phẩm rượu',
        quantity: row.RequestedQuantity || (items.length > 0 ? items[0].Quantity : 50),
        target_price: row.TargetPrice || 70000000,
        status: row.Status,
        created_at: row.CreatedAt ? row.CreatedAt.toISOString().split('T')[0] : null
      };
    });

    res.json({ success: true, data: rfqs });
  } catch (err) {
    console.error('Error fetching RFQs:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách Yêu cầu báo giá' });
  }
};

const createRFQ = async (req, res) => {
  const { product_name, quantity, requested_quantity, target_price, title, product_id } = req.body;
  const qty = parseInt(quantity || requested_quantity) || 50;
  const price = parseFloat(target_price) || 70000000;
  const productId = parseInt(product_id) || 101;

  try {
    const pool = await getPool();
    
    // Look up actual product name if not provided
    let finalProductName = product_name;
    if (!finalProductName && productId) {
      const prodQuery = await pool.request()
        .input('ProductID', sql.BigInt, productId)
        .query('SELECT ProductName FROM Products WHERE ProductID = @ProductID');
      if (prodQuery.recordset.length > 0) {
        finalProductName = prodQuery.recordset[0].ProductName;
      }
    }
    if (!finalProductName) finalProductName = 'Sản phẩm rượu';

    const finalTitle = title || `Yêu cầu báo giá ${finalProductName}`;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Hardcode BuyerCompanyID = 1, CreatedBy = 1 for now (if not using auth properly in this context)
      const buyerCompanyId = req.user && req.user.company_id ? req.user.company_id : 1;
      const createdBy = req.user && req.user.user_id ? req.user.user_id : 1;

      const rfqResult = await transaction.request()
        .input('BuyerCompanyID', sql.BigInt, buyerCompanyId)
        .input('CreatedBy', sql.BigInt, createdBy)
        .input('Title', sql.NVarChar, finalTitle)
        .input('Description', sql.NVarChar, finalProductName)
        .input('ProductID', sql.BigInt, productId)
        .input('RequestedQuantity', sql.Int, qty)
        .input('TargetPrice', sql.Decimal(18,2), price)
        .input('DeliveryDate', sql.Date, req.body.delivery_date ? new Date(req.body.delivery_date) : new Date())
        .query(`
          INSERT INTO RFQs (BuyerCompanyID, CreatedBy, Title, Description, Status, CreatedAt, ProductID, RequestedQuantity, TargetPrice, DeliveryDate)
          OUTPUT INSERTED.RFQID, INSERTED.CreatedAt
          VALUES (@BuyerCompanyID, @CreatedBy, @Title, @Description, 'SUBMITTED', GETDATE(), @ProductID, @RequestedQuantity, @TargetPrice, @DeliveryDate)
        `);

      const newId = rfqResult.recordset[0].RFQID;
      const createdAt = rfqResult.recordset[0].CreatedAt;

      await transaction.request()
        .input('RFQID', sql.BigInt, newId)
        .input('ProductID', sql.BigInt, productId)
        .input('Quantity', sql.Int, qty)
        .query(`
          INSERT INTO RFQItems (RFQID, ProductID, Quantity)
          VALUES (@RFQID, @ProductID, @Quantity)
        `);

      await transaction.commit();
      
      const newRfq = {
        rfq_id: newId,
        buyer_company: 'Công ty Khách Hàng',
        title: finalTitle,
        product_name: finalProductName,
        quantity: qty,
        target_price: price,
        status: 'SUBMITTED',
        created_at: createdAt.toISOString().split('T')[0]
      };

      res.status(201).json({ success: true, message: 'Tạo Yêu cầu Báo giá RFQ thành công!', rfq: newRfq });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error creating RFQ:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo RFQ' });
  }
};

// Quotations API
const getQuotations = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT q.*, 
             bc.CompanyName as buyer_company, 
             sc.CompanyName as seller_company,
             (SELECT * FROM QuotationItems qi WHERE qi.QuotationID = q.QuotationID FOR JSON PATH) as items
      FROM Quotations q
      LEFT JOIN Companies bc ON q.BuyerCompanyID = bc.CompanyID
      LEFT JOIN Companies sc ON q.SellerCompanyID = sc.CompanyID
      ORDER BY q.CreatedAt DESC
    `);
    
    const quotations = result.recordset.map(row => {
      let items = [];
      if (row.items) {
        items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
      }
      return {
        quotation_id: row.QuotationID,
        rfq_id: row.RFQID,
        buyer_company: row.buyer_company || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
        seller_company: row.seller_company || 'MAISON DE L\'ALCOOL RED APRON FACTORY',
        offer_unit_price: items.length > 0 ? items[0].OfferUnitPrice : 0,
        quantity: items.length > 0 ? items[0].Quantity : 0,
        valid_until: row.ValidUntil ? row.ValidUntil.toISOString().split('T')[0] : '2026-12-31',
        status: row.Status
      };
    });

    res.json({ success: true, data: quotations });
  } catch (err) {
    console.error('Error fetching quotations:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách Báo giá' });
  }
};

const createQuotation = async (req, res) => {
  const { rfq_id, offer_unit_price, quantity } = req.body;
  const rfqId = parseInt(rfq_id);
  const price = parseFloat(offer_unit_price);
  const qty = parseInt(quantity);

  if (!rfqId || isNaN(price) || price <= 0) {
    return res.status(400).json({ success: false, message: 'Đơn giá báo giá phải lớn hơn 0 VNĐ.' });
  }

  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Fetch BuyerCompanyID from RFQ
      const rfqQuery = await transaction.request()
        .input('RFQID', sql.BigInt, rfqId)
        .query(`SELECT BuyerCompanyID, ProductID, RequestedQuantity FROM RFQs WHERE RFQID = @RFQID`);
      
      if (rfqQuery.recordset.length === 0) {
        throw new Error('RFQ không tồn tại');
      }
      const rfq = rfqQuery.recordset[0];
      const buyerCompanyId = rfq.BuyerCompanyID;
      const productId = req.body.product_id || rfq.ProductID || 101;
      const actualQty = qty || rfq.RequestedQuantity || 50;
      const totalAmount = actualQty * price;
      
      const sellerCompanyId = req.user && req.user.company_id ? req.user.company_id : 2;
      const createdBy = req.user && req.user.user_id ? req.user.user_id : 1;

      const qResult = await transaction.request()
        .input('RFQID', sql.BigInt, rfqId)
        .input('BuyerCompanyID', sql.BigInt, buyerCompanyId)
        .input('SellerCompanyID', sql.BigInt, sellerCompanyId)
        .input('CreatedBy', sql.BigInt, createdBy)
        .input('ValidUntil', sql.DateTime, new Date('2026-12-31'))
        .query(`
          INSERT INTO Quotations (RFQID, BuyerCompanyID, SellerCompanyID, CreatedBy, Status, ValidUntil, CreatedAt)
          OUTPUT INSERTED.QuotationID
          VALUES (@RFQID, @BuyerCompanyID, @SellerCompanyID, @CreatedBy, 'PENDING', @ValidUntil, GETDATE())
        `);

      const newId = qResult.recordset[0].QuotationID;

      await transaction.request()
        .input('QuotationID', sql.BigInt, newId)
        .input('ProductID', sql.BigInt, productId)
        .input('Quantity', sql.Int, actualQty)
        .input('OfferUnitPrice', sql.Decimal(18,2), price)
        .query(`
          INSERT INTO QuotationItems (QuotationID, ProductID, Quantity, OfferUnitPrice)
          VALUES (@QuotationID, @ProductID, @Quantity, @OfferUnitPrice)
        `);

      await transaction.request()
        .input('RFQID', sql.BigInt, rfqId)
        .query(`UPDATE RFQs SET Status = 'QUOTATION_SENT' WHERE RFQID = @RFQID`);

      await transaction.commit();
      
      const newQuotation = {
        quotation_id: newId,
        rfq_id: rfqId,
        buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
        seller_company: 'MAISON DE L\'ALCOOL RED APRON FACTORY',
        offer_unit_price: price,
        quantity: qty,
        valid_until: '2026-12-31',
        status: 'PENDING'
      };

      res.status(201).json({ success: true, message: 'Phát hành Bảng Báo Giá (Quotation) thành công!', quotation: newQuotation });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error creating quotation:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo báo giá' });
  }
};

const updateQuotationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'ACCEPTED' | 'REJECTED'
  const quotationId = parseInt(id);

  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const qCheck = await transaction.request()
        .input('QuotationID', sql.BigInt, quotationId)
        .query(`
          SELECT q.RFQID, q.BuyerCompanyID, q.SellerCompanyID, q.Status, qi.ProductID, qi.OfferUnitPrice, qi.Quantity 
          FROM Quotations q
          LEFT JOIN QuotationItems qi ON q.QuotationID = qi.QuotationID
          WHERE q.QuotationID = @QuotationID
        `);
      
      if (qCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo giá' });
      }

      const qData = qCheck.recordset[0];
      
      // Prevent duplicate order creation if quotation was already accepted
      if (qData.Status === 'ACCEPTED') {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Báo giá này đã được chấp nhận từ trước.' });
      }

      const rfqId = qData.RFQID;
      const totalAmount = (qData.OfferUnitPrice || 0) * (qData.Quantity || 0);

      await transaction.request()
        .input('QuotationID', sql.BigInt, quotationId)
        .input('Status', sql.NVarChar, status)
        .query(`UPDATE Quotations SET Status = @Status WHERE QuotationID = @QuotationID`);

      if (status === 'ACCEPTED') {
        // 1. Check buyer credit limit
        const creditCheck = await transaction.request()
          .input('CompanyID', sql.BigInt, qData.BuyerCompanyID)
          .query('SELECT CreditLimitAmount, UsedAmount FROM CreditLimits WHERE CompanyID = @CompanyID');
        
        if (creditCheck.recordset.length > 0) {
          const { CreditLimitAmount, UsedAmount } = creditCheck.recordset[0];
          if (UsedAmount + totalAmount > CreditLimitAmount) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: `Hạn mức tín dụng không đủ để hoàn tất đơn hàng. Còn lại: ${(CreditLimitAmount - UsedAmount).toLocaleString('vi-VN')} VNĐ.` });
          }
        }

        // 2. Check overdue unpaid invoices
        const overdueCheck = await transaction.request()
          .input('CompanyID', sql.BigInt, qData.BuyerCompanyID)
          .query(`
            SELECT COUNT(*) as overdue_count 
            FROM Invoices i
            JOIN Orders o ON i.OrderID = o.OrderID
            WHERE o.BuyerCompanyID = @CompanyID AND i.Status = 'UNPAID' AND i.DueDate < GETDATE()
          `);
        
        if (overdueCheck.recordset.length > 0 && overdueCheck.recordset[0].overdue_count > 0) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Tài khoản sỉ bị tạm khóa chức năng mua nợ Net-30 do có hóa đơn quá hạn chưa thanh toán.' });
        }

        // 3. Verify & Reserve stock atomically (Conforms to E-Commerce Overselling Invariants)
        const prodId = qData.ProductID || 101;
        const stockReserveResult = await transaction.request()
          .input('ProductID', sql.BigInt, prodId)
          .input('Quantity', sql.Int, qData.Quantity)
          .query(`
            UPDATE Inventories 
            SET ReservedQuantity = ReservedQuantity + @Quantity 
            WHERE ProductID = @ProductID AND (QuantityOnHand - ReservedQuantity) >= @Quantity
          `);

        if (stockReserveResult.rowsAffected[0] === 0) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Số lượng hàng tồn kho khả dụng không đủ để đáp ứng đơn hàng này.' });
        }

        const orderNumber = `ORD-2026-${8800 + quotationId}`;
        const createdBy = req.user && req.user.user_id ? req.user.user_id : 1;
        
        const ordRes = await transaction.request()
          .input('BuyerCompanyID', sql.BigInt, qData.BuyerCompanyID)
          .input('SellerCompanyID', sql.BigInt, qData.SellerCompanyID)
          .input('QuotationID', sql.BigInt, quotationId)
          .input('OrderNumber', sql.NVarChar, orderNumber)
          .input('TotalAmount', sql.Decimal(18,2), totalAmount)
          .input('CreatedBy', sql.BigInt, createdBy)
          .query(`
            INSERT INTO Orders (BuyerCompanyID, SellerCompanyID, QuotationID, OrderNumber, OrderStatus, PaymentMethod, TotalAmount, CreatedBy, CreatedAt)
            OUTPUT INSERTED.OrderID
            VALUES (@BuyerCompanyID, @SellerCompanyID, @QuotationID, @OrderNumber, 'PROCESSING', 'NET_30_CREDIT', @TotalAmount, @CreatedBy, GETDATE())
          `);
        
        const orderId = ordRes.recordset[0].OrderID;

        await transaction.request()
          .input('OrderID', sql.BigInt, orderId)
          .input('ProductID', sql.BigInt, prodId)
          .input('Quantity', sql.Int, qData.Quantity)
          .input('UnitPrice', sql.Decimal(18,2), qData.OfferUnitPrice)
          .query(`
            INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice)
            VALUES (@OrderID, @ProductID, @Quantity, @UnitPrice)
          `);

        const invoiceNumber = `INV-2026-${8800 + quotationId}`;
        await transaction.request()
          .input('OrderID', sql.BigInt, orderId)
          .input('InvoiceNumber', sql.NVarChar, invoiceNumber)
          .input('Amount', sql.Decimal(18,2), totalAmount)
          .query(`
            INSERT INTO Invoices (OrderID, InvoiceNumber, InvoiceDate, DueDate, Status, Amount)
            VALUES (@OrderID, @InvoiceNumber, GETDATE(), DATEADD(day, 30, GETDATE()), 'UNPAID', @Amount)
          `);

        // Update credit limit
        await transaction.request()
          .input('CompanyID', sql.BigInt, qData.BuyerCompanyID)
          .input('Amount', sql.Decimal(18,2), totalAmount)
          .query(`
            UPDATE CreditLimits 
            SET UsedAmount = UsedAmount + @Amount
            WHERE CompanyID = @CompanyID
          `);

        // Update RFQ status
        await transaction.request()
          .input('RFQID', sql.BigInt, rfqId)
          .query(`UPDATE RFQs SET Status = 'ACCEPTED' WHERE RFQID = @RFQID`);

      } else {
        await transaction.request()
          .input('RFQID', sql.BigInt, rfqId)
          .query(`UPDATE RFQs SET Status = 'SUBMITTED' WHERE RFQID = @RFQID`);
      }

      await transaction.commit();
      res.json({
        success: true,
        message: `Đã cập nhật trạng thái báo giá sang: ${status}`
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating quotation status:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateRFQStatus = async (req, res) => {
  const rfqId = parseInt(req.params.id);
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Thiếu trạng thái status' });
  }
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('RFQID', sql.BigInt, rfqId)
      .input('Status', sql.NVarChar, status)
      .query(`UPDATE RFQs SET Status = @Status, UpdatedAt = GETDATE() WHERE RFQID = @RFQID`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy RFQ' });
    }

    // Insert Audit Log
    await pool.request()
      .input('UserID', sql.BigInt, req.user?.user_id || 1)
      .input('Action', sql.NVarChar, `Chuyển cơ hội RFQ-${rfqId} sang trạng thái: ${status}`)
      .input('TableName', sql.NVarChar, 'RFQs')
      .input('RecordID', sql.BigInt, rfqId)
      .input('IPAddress', sql.NVarChar, req.ip || '127.0.0.1')
      .query(`INSERT INTO AuditLogs (UserID, Action, TableName, RecordID, IPAddress, CreatedAt) VALUES (@UserID, @Action, @TableName, @RecordID, @IPAddress, GETDATE())`);

    res.json({ success: true, message: `Đã chuyển trạng thái RFQ-${rfqId} sang ${status}` });
  } catch (err) {
    console.error('Error updating RFQ status:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái RFQ' });
  }
};

module.exports = {
  getRFQs,
  createRFQ,
  updateRFQStatus,
  getQuotations,
  createQuotation,
  updateQuotationStatus
};
