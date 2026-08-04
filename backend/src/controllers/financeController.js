const { getPool, sql } = require('../config/db');

const getOrders = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT o.OrderID, o.OrderNumber, o.TotalAmount, o.OrderStatus, o.PaymentMethod, o.CreatedAt,
             bc.CompanyName as buyer_company,
             ISNULL(i.Status, 'UNPAID') as payment_status
      FROM Orders o
      LEFT JOIN Companies bc ON o.BuyerCompanyID = bc.CompanyID
      LEFT JOIN Invoices i ON o.OrderID = i.OrderID
      ORDER BY o.CreatedAt DESC
    `);

    const orders = result.recordset.map(row => ({
      order_id: row.OrderID,
      order_number: row.OrderNumber,
      buyer_company: row.buyer_company,
      total_amount: row.TotalAmount,
      order_status: row.OrderStatus,
      payment_method: row.PaymentMethod,
      payment_status: row.payment_status,
      created_at: row.CreatedAt ? row.CreatedAt.toISOString().split('T')[0] : null
    }));

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách đơn hàng' });
  }
};

const getCreditLimit = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const pool = await getPool();
    const result = await pool.request()
      .input('CompanyID', sql.Int, company_id)
      .query(`SELECT * FROM CreditLimits WHERE CompanyID = @CompanyID`);
    
    let credit_limit = { total_limit: 1000000000, used_amount: 0, available_balance: 1000000000 };
    if (result.recordset.length > 0) {
      const row = result.recordset[0];
      credit_limit = {
        total_limit: row.CreditLimitAmount,
        used_amount: row.UsedAmount,
        available_balance: row.AvailableAmount
      };
    }

    const invResult = await pool.request()
      .input('CompanyID', sql.Int, company_id)
      .query(`
      SELECT i.InvoiceID, i.OrderID, i.InvoiceNumber, i.InvoiceDate, i.DueDate, i.Status, i.Amount, ISNULL(i.PaidAmount, 0) as PaidAmount,
             o.OrderNumber, bc.CompanyName as BuyerCompany
      FROM Invoices i
      JOIN Orders o ON i.OrderID = o.OrderID
      LEFT JOIN Companies bc ON o.BuyerCompanyID = bc.CompanyID
      WHERE o.BuyerCompanyID = @CompanyID OR @CompanyID = 1
      ORDER BY i.InvoiceDate DESC
    `);

    const invoices = invResult.recordset.map(row => {
      const amt = Number(row.Amount || 0);
      const paid = Number(row.PaidAmount || 0);
      const remaining = amt - paid > 0 ? amt - paid : 0;
      return {
        invoice_id: row.InvoiceID,
        order_number: row.OrderNumber || `ORD-2026-${8800 + row.OrderID}`,
        buyer_company: row.BuyerCompany || 'Red Apron Buyer',
        invoice_number: row.InvoiceNumber,
        issue_date: row.InvoiceDate ? row.InvoiceDate.toISOString().split('T')[0] : null,
        due_date: row.DueDate ? row.DueDate.toISOString().split('T')[0] : null,
        status: row.Status,
        amount: amt,
        paid_amount: paid,
        remaining_amount: remaining
      };
    });

    res.json({ success: true, credit: credit_limit, invoices });
  } catch (err) {
    console.error('Error fetching credit limit:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải công nợ' });
  }
};

const payInvoice = async (req, res) => {
  const invId = parseInt(req.params.id);
  const { paid_amount, payment_method, payment_reference } = req.body;
  const payMethod = payment_method || 'BANK_TRANSFER';
  const payRef = payment_reference || `PAY-${Date.now()}`;
  
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Swimlane System: Query invoice details
      const invCheck = await transaction.request()
        .input('InvoiceID', sql.BigInt, invId)
        .query(`
          SELECT i.Status, i.Amount, ISNULL(i.PaidAmount, 0) as PaidAmount, i.OrderID, o.BuyerCompanyID 
          FROM Invoices i
          JOIN Orders o ON i.OrderID = o.OrderID
          WHERE i.InvoiceID = @InvoiceID
        `);

      if (invCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
      }

      const inv = invCheck.recordset[0];
      const totalAmt = Number(inv.Amount || 0);
      const currentPaid = Number(inv.PaidAmount || 0);
      const remainingUnpaid = totalAmt - currentPaid > 0 ? totalAmt - currentPaid : 0;

      const payVal = paid_amount ? Number(paid_amount) : remainingUnpaid;

      // 2. Swimlane System: Validation (Kiểm tra số tiền > 0 và <= Số tiền nợ trên hóa đơn)
      if (inv.Status === 'PAID' || remainingUnpaid <= 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Hóa đơn này đã được thanh toán hoàn tất trước đó.' });
      }

      if (isNaN(payVal) || payVal <= 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Số tiền thanh toán phải lớn hơn 0.' });
      }

      if (payVal > remainingUnpaid) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: `Số tiền thanh toán (${payVal.toLocaleString()} đ) vượt quá dư nợ còn lại (${remainingUnpaid.toLocaleString()} đ).` });
      }

      const newTotalPaid = currentPaid + payVal;
      const newStatus = newTotalPaid >= totalAmt ? 'PAID' : 'PARTIALLY_PAID';

      // 3. Swimlane Database: Thực thi song song 3 nhánh DB theo Activity Diagram

      // BRANCH 1: Ghi nhận dòng tiền thực tế -> INSERT INTO Payments
      await transaction.request()
        .input('InvoiceID', sql.BigInt, invId)
        .input('Amount', sql.Decimal(18,2), payVal)
        .input('PaidAmount', sql.Decimal(18,2), payVal)
        .input('PaymentMethod', sql.NVarChar, payMethod)
        .input('PaymentReference', sql.NVarChar, payRef)
        .query(`
          INSERT INTO Payments (InvoiceID, Amount, PaidAmount, PaymentMethod, PaymentReference, PaidAt)
          VALUES (@InvoiceID, @Amount, @PaidAmount, @PaymentMethod, @PaymentReference, GETDATE())
        `);

      // BRANCH 2: Cập nhật Hóa đơn -> UPDATE Invoices
      await transaction.request()
        .input('InvoiceID', sql.BigInt, invId)
        .input('PaidAmount', sql.Decimal(18,2), newTotalPaid)
        .input('Status', sql.NVarChar, newStatus)
        .query(`
          UPDATE Invoices 
          SET PaidAmount = @PaidAmount, Status = @Status 
          WHERE InvoiceID = @InvoiceID
        `);

      // BRANCH 3: Cập nhật Hạn mức tín dụng -> UPDATE CreditLimits (Giảm UsedAmount theo số tiền trả)
      await transaction.request()
        .input('PaidAmount', sql.Decimal(18,2), payVal)
        .input('CompanyID', sql.Int, inv.BuyerCompanyID)
        .query(`
          UPDATE CreditLimits 
          SET UsedAmount = CASE WHEN (UsedAmount - @PaidAmount) < 0 THEN 0 ELSE (UsedAmount - @PaidAmount) END
          WHERE CompanyID = @CompanyID
        `);

      // Commit Transaction
      await transaction.commit();
      return res.json({ 
        success: true, 
        message: `Ghi nhận thanh toán thành công ${payVal.toLocaleString('vi-VN')} đ!`,
        paid_amount: payVal,
        remaining_unpaid: totalAmt - newTotalPaid,
        status: newStatus
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error paying invoice:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi thanh toán hóa đơn' });
  }
};

const updateCreditLimit = async (req, res) => {
  const { total_limit } = req.body;
  const newLimit = parseFloat(total_limit);
  if (!newLimit || newLimit <= 0) {
    return res.status(400).json({ success: false, message: 'Hạn mức phải lớn hơn 0' });
  }

  try {
    const company_id = req.user.company_id;
    const pool = await getPool();
    const check = await pool.request()
      .input('CompanyID', sql.Int, company_id)
      .query(`SELECT UsedAmount FROM CreditLimits WHERE CompanyID = @CompanyID`);
    
    let used = 0;
    if (check.recordset.length > 0) {
      used = check.recordset[0].UsedAmount;
      await pool.request()
        .input('TotalLimit', sql.Decimal(18,2), newLimit)
        .input('CompanyID', sql.Int, company_id)
        .query(`
          UPDATE CreditLimits 
          SET CreditLimitAmount = @TotalLimit
          WHERE CompanyID = @CompanyID
        `);
    } else {
      await pool.request()
        .input('TotalLimit', sql.Decimal(18,2), newLimit)
        .input('CompanyID', sql.Int, company_id)
        .query(`
          INSERT INTO CreditLimits (CompanyID, CreditLimitAmount, UsedAmount)
          VALUES (@CompanyID, @TotalLimit, 0)
        `);
    }

    const newCreditLimit = {
      total_limit: newLimit,
      used_amount: used,
      available_balance: newLimit - used
    };

    res.json({ success: true, message: `Đã cập nhật hạn mức tín dụng mới: ${(newLimit / 1000000000).toFixed(1)} Tỷ VNĐ`, credit: newCreditLimit });
  } catch (err) {
    console.error('Error updating credit limit:', err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hạn mức' });
  }
};

const getFinancialSummary = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        SUM(Amount) as total_invoiced,
        SUM(CASE WHEN Status = 'PAID' THEN Amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN Status = 'UNPAID' THEN Amount ELSE 0 END) as total_unpaid,
        COUNT(CASE WHEN Status = 'UNPAID' AND DueDate < GETDATE() THEN 1 END) as overdue_count,
        SUM(CASE WHEN Status = 'UNPAID' AND DueDate < GETDATE() THEN Amount ELSE 0 END) as overdue_amount
      FROM Invoices
    `);
    
    const stats = result.recordset[0];
    const creditResult = await pool.request().query(`SELECT * FROM CreditLimits WHERE CompanyID = 1`);
    
    let credit_limit = { total_limit: 1000000000, used_amount: 0, available_balance: 1000000000 };
    if (creditResult.recordset.length > 0) {
      const row = creditResult.recordset[0];
      credit_limit = {
        total_limit: row.CreditLimitAmount,
        used_amount: row.UsedAmount,
        available_balance: row.AvailableAmount
      };
    }

    const total_invoiced = stats.total_invoiced || 0;
    const total_paid = stats.total_paid || 0;

    res.json({
      success: true,
      summary: {
        total_invoiced: total_invoiced,
        total_paid: total_paid,
        total_unpaid: stats.total_unpaid || 0,
        overdue_count: stats.overdue_count || 0,
        overdue_amount: stats.overdue_amount || 0,
        credit_limit: credit_limit,
        payment_rate: total_invoiced > 0 ? Math.round((total_paid / total_invoiced) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Error fetching financial summary:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải tổng quan tài chính' });
  }
};

const getOverdueInvoices = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT InvoiceID, OrderID, InvoiceNumber, InvoiceDate, DueDate, Status, Amount 
      FROM Invoices 
      WHERE Status = 'UNPAID' AND DueDate < GETDATE()
      ORDER BY DueDate ASC
    `);

    const overdue = result.recordset.map(row => ({
      invoice_id: row.InvoiceID,
      invoice_number: row.InvoiceNumber,
      issue_date: row.InvoiceDate ? row.InvoiceDate.toISOString().split('T')[0] : null,
      due_date: row.DueDate ? row.DueDate.toISOString().split('T')[0] : null,
      status: row.Status,
      amount: row.Amount
    }));

    res.json({ success: true, data: overdue });
  } catch (err) {
    console.error('Error fetching overdue invoices:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải hóa đơn quá hạn' });
  }
};

const getLCDocuments = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM LCDocuments ORDER BY CreatedAt DESC`);
    
    const docs = result.recordset.map(row => ({
      lc_id: row.LCID,
      buyer_company: row.BuyerCompany,
      lc_number: row.LCNumber,
      issuing_bank: row.IssuingBank,
      amount: row.Amount,
      expiry_date: row.ExpiryDate ? row.ExpiryDate.toISOString().split('T')[0] : null,
      document_url: row.DocumentUrl,
      status: row.Status,
      created_at: row.CreatedAt ? row.CreatedAt.toISOString().split('T')[0] : null
    }));

    res.json({ success: true, data: docs });
  } catch (err) {
    console.error('Error fetching L/C docs:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải thư tín dụng L/C' });
  }
};

const submitLCDocument = async (req, res) => {
  const { lc_number, issuing_bank, amount, expiry_date, buyer_company } = req.body;
  if (!lc_number || !issuing_bank || !amount || !expiry_date) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin L/C.' });
  }

  const docUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.document_url || '/uploads/lc_default.pdf');

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('BuyerCompany', sql.NVarChar, buyer_company || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON')
      .input('LCNumber', sql.NVarChar, lc_number)
      .input('IssuingBank', sql.NVarChar, issuing_bank)
      .input('Amount', sql.Decimal(18,2), parseFloat(amount))
      .input('ExpiryDate', sql.Date, new Date(expiry_date))
      .input('DocumentUrl', sql.NVarChar, docUrl)
      .query(`
        INSERT INTO LCDocuments (BuyerCompany, LCNumber, IssuingBank, Amount, ExpiryDate, DocumentUrl, Status, CreatedAt)
        OUTPUT INSERTED.LCID
        VALUES (@BuyerCompany, @LCNumber, @IssuingBank, @Amount, @ExpiryDate, @DocumentUrl, 'SUBMITTED', GETDATE())
      `);

    const newLC = {
      lc_id: result.recordset[0].LCID,
      lc_number,
      issuing_bank,
      amount: parseFloat(amount),
      status: 'SUBMITTED'
    };

    res.json({ success: true, message: 'Nộp L/C thành công!', lc_document: newLC });
  } catch (err) {
    console.error('Error submitting L/C doc:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi nộp L/C' });
  }
};

const verifyLCDocument = async (req, res) => {
  const { status } = req.body;
  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('LCID', sql.Int, parseInt(req.params.id))
      .input('Status', sql.NVarChar, status)
      .query(`UPDATE LCDocuments SET Status = @Status WHERE LCID = @LCID`);

    res.json({ success: true, message: `Đã cập nhật trạng thái L/C thành ${status}` });
  } catch (err) {
    console.error('Error verifying L/C doc:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xác thực L/C' });
  }
};

const rejectLCDocument = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('LCID', sql.Int, parseInt(req.params.id))
      .input('Status', sql.NVarChar, 'REJECTED')
      .query(`UPDATE LCDocuments SET Status = @Status WHERE LCID = @LCID`);

    res.json({ success: true, message: `Đã từ chối L/C` });
  } catch (err) {
    console.error('Error rejecting L/C doc:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi từ chối L/C' });
  }
};

module.exports = {
  getOrders,
  getCreditLimit,
  payInvoice,
  updateCreditLimit,
  getFinancialSummary,
  getOverdueInvoices,
  getLCDocuments,
  submitLCDocument,
  verifyLCDocument,
  rejectLCDocument
};
