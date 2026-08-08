const { getPool } = require('../config/db');

const getOrders = async (req, res) => {
  try {
    const pool = await getPool();
    let query = `
      SELECT o.order_id, o.order_number, o.total_amount, o.order_status, o.payment_method, o.created_at,
             bc.company_name as buyer_company,
             COALESCE(i.status, 'UNPAID') as payment_status
      FROM orders o
      LEFT JOIN companies bc ON o.buyer_company_id = bc.company_id
      LEFT JOIN invoices i ON o.order_id = i.order_id
    `;

    const userType = req.user?.user_type || 'BUYER_REP';
    const isBuyerRole = userType === 'BUYER_REP' || userType === 'BUYER';
    let params = [];

    if (isBuyerRole) {
      if (req.user?.company_id) {
        query += ` WHERE (o.buyer_company_id = $1 OR o.created_by = $2) `;
        params.push(req.user.company_id, req.user.user_id || 0);
      } else {
        query += ` WHERE 1=0 `;
      }
    }
    query += ` ORDER BY o.created_at DESC `;

    const result = await pool.query(query, params);

    const orders = result.rows.map(row => ({
      order_id: row.order_id,
      order_number: row.order_number,
      buyer_company: row.buyer_company,
      total_amount: row.total_amount,
      order_status: row.order_status,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      created_at: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null
    }));

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách đơn hàng' });
  }
};

const getCreditLimit = async (req, res) => {
  try {
    const userType = req.user?.user_type || 'BUYER_REP';
    const isBuyerRole = userType === 'BUYER_REP' || userType === 'BUYER';
    const companyId = req.user?.company_id;

    const pool = await getPool();
    let credit_limit = { total_limit: 0, used_amount: 0, available_balance: 0 };
    let invoices = [];

    if (isBuyerRole) {
      if (companyId) {
        // Fetch CreditLimit for this company
        const result = await pool.query(`SELECT * FROM credit_limits WHERE company_id = $1`, [companyId]);

        if (result.rows.length > 0) {
          const row = result.rows[0];
          const total = Number(row.credit_limit_amount || 0);
          const used = Number(row.used_amount || 0);
          credit_limit = {
            total_limit: total,
            used_amount: used,
            available_balance: total - used > 0 ? total - used : 0
          };
        }

        // Fetch Invoices for this company ONLY
        const invResult = await pool.query(`
            SELECT i.invoice_id, i.order_id, i.invoice_number, i.invoice_date, i.due_date, i.status, i.amount, COALESCE(i.paid_amount, 0) as paid_amount,
                   o.order_number, bc.company_name as buyer_company
            FROM invoices i
            JOIN orders o ON i.order_id = o.order_id
            LEFT JOIN companies bc ON o.buyer_company_id = bc.company_id
            WHERE o.buyer_company_id = $1
            ORDER BY i.invoice_date DESC
          `, [companyId]);

        invoices = invResult.rows.map(row => {
          const amt = Number(row.amount || 0);
          const paid = Number(row.paid_amount || 0);
          const remaining = amt - paid > 0 ? amt - paid : 0;
          return {
            invoice_id: row.invoice_id,
            order_number: row.order_number || `ORD-2026-${8800 + row.order_id}`,
            buyer_company: row.buyer_company || 'Red Apron Buyer',
            invoice_number: row.invoice_number,
            issue_date: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : null,
            due_date: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
            status: row.status,
            amount: amt,
            paid_amount: paid,
            remaining_amount: remaining
          };
        });
      }
    } else {
      // ADMIN / FINANCE OFFICER: Fetch summary and all invoices
      const result = await pool.query(`SELECT * FROM credit_limits WHERE company_id = $1`, [companyId || 1]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        const total = Number(row.credit_limit_amount || 0);
        const used = Number(row.used_amount || 0);
        credit_limit = {
          total_limit: total,
          used_amount: used,
          available_balance: total - used > 0 ? total - used : 0
        };
      }

      const invResult = await pool.query(`
        SELECT i.invoice_id, i.order_id, i.invoice_number, i.invoice_date, i.due_date, i.status, i.amount, COALESCE(i.paid_amount, 0) as paid_amount,
               o.order_number, bc.company_name as buyer_company
        FROM invoices i
        JOIN orders o ON i.order_id = o.order_id
        LEFT JOIN companies bc ON o.buyer_company_id = bc.company_id
        ORDER BY i.invoice_date DESC
      `);

      invoices = invResult.rows.map(row => {
        const amt = Number(row.amount || 0);
        const paid = Number(row.paid_amount || 0);
        const remaining = amt - paid > 0 ? amt - paid : 0;
        return {
          invoice_id: row.invoice_id,
          order_number: row.order_number || `ORD-2026-${8800 + row.order_id}`,
          buyer_company: row.buyer_company || 'Red Apron Buyer',
          invoice_number: row.invoice_number,
          issue_date: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : null,
          due_date: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
          status: row.status,
          amount: amt,
          paid_amount: paid,
          remaining_amount: remaining
        };
      });
    }

    res.json({
      success: true,
      credit: credit_limit,
      invoices
    });
  } catch (err) {
    console.error('Error fetching credit limit:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải dữ liệu Đơn hàng & Công nợ' });
  }
};

const payInvoice = async (req, res) => {
  const invId = parseInt(req.params.id);
  const { paid_amount, payment_method, payment_reference } = req.body;
  const payMethod = payment_method || 'BANK_TRANSFER';
  const payRef = payment_reference || `PAY-${Date.now()}`;
  
  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const invCheck = await client.query(`
          SELECT i.status, i.amount, COALESCE(i.paid_amount, 0) as paid_amount, i.order_id, o.buyer_company_id 
          FROM invoices i
          JOIN orders o ON i.order_id = o.order_id
          WHERE i.invoice_id = $1
        `, [invId]);

      if (invCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
      }
      const inv = invCheck.rows[0];

      if (req.user?.company_id && inv.buyer_company_id !== req.user.company_id && req.user.user_type !== 'PLATFORM_ADMIN' && req.user.user_type !== 'COMPANY_ADMIN') {
         if (req.user.user_type === 'BUYER_REP') {
             await client.query('ROLLBACK');
             return res.status(403).json({ success: false, message: 'Bạn không có quyền thanh toán hóa đơn của doanh nghiệp khác.' });
         }
      }
      const totalAmt = Number(inv.amount || 0);
      const currentPaid = Number(inv.paid_amount || 0);
      const remainingUnpaid = totalAmt - currentPaid > 0 ? totalAmt - currentPaid : 0;

      const payVal = paid_amount ? Number(paid_amount) : remainingUnpaid;

      if (inv.status === 'PAID' || remainingUnpaid <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Hóa đơn này đã được thanh toán hoàn tất trước đó.' });
      }

      if (isNaN(payVal) || payVal <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Số tiền thanh toán phải lớn hơn 0.' });
      }

      if (payVal > remainingUnpaid) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Số tiền thanh toán (${payVal.toLocaleString()} đ) vượt quá dư nợ còn lại (${remainingUnpaid.toLocaleString()} đ).` });
      }

      const newTotalPaid = currentPaid + payVal;
      const newStatus = newTotalPaid >= totalAmt ? 'PAID' : 'PARTIALLY_PAID';

      await client.query(`
          INSERT INTO payments (invoice_id, amount, paid_amount, payment_method, payment_reference, paid_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [invId, payVal, payVal, payMethod, payRef]);

      const invUpdateRes = await client.query(`
          UPDATE invoices 
          SET paid_amount = COALESCE(paid_amount, 0) + $1, status = CASE WHEN (COALESCE(paid_amount, 0) + $1) >= amount THEN 'PAID' ELSE 'PARTIALLY_PAID' END
          WHERE invoice_id = $2 AND (amount - COALESCE(paid_amount, 0)) >= $1
        `, [payVal, invId]);

      if (invUpdateRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Dữ liệu hóa đơn đã thay đổi hoặc dư nợ không đủ để thanh toán số tiền này. Vui lòng thử lại.' });
      }

      await client.query(`
          UPDATE credit_limits 
          SET used_amount = CASE WHEN (COALESCE(used_amount, 0) - $1) < 0 THEN 0 ELSE (COALESCE(used_amount, 0) - $1) END
          WHERE company_id = $2
        `, [payVal, inv.buyer_company_id]);

      await client.query('COMMIT');
      return res.json({ 
        success: true, 
        message: `Ghi nhận thanh toán thành công ${payVal.toLocaleString('vi-VN')} đ!`,
        paid_amount: payVal,
        remaining_unpaid: totalAmt - newTotalPaid,
        status: newStatus
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
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
    const check = await pool.query(`SELECT used_amount FROM credit_limits WHERE company_id = $1`, [company_id]);
    
    let used = 0;
    if (check.rows.length > 0) {
      used = Number(check.rows[0].used_amount || 0);
      await pool.query(`
          UPDATE credit_limits 
          SET credit_limit_amount = $1
          WHERE company_id = $2
        `, [newLimit, company_id]);
    } else {
      await pool.query(`
          INSERT INTO credit_limits (company_id, credit_limit_amount, used_amount)
          VALUES ($1, $2, 0)
        `, [company_id, newLimit]);
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
    const result = await pool.query(`
      SELECT 
        SUM(amount) as total_invoiced,
        SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'UNPAID' THEN amount ELSE 0 END) as total_unpaid,
        COUNT(CASE WHEN status = 'UNPAID' AND due_date < CURRENT_DATE THEN 1 END) as overdue_count,
        SUM(CASE WHEN status = 'UNPAID' AND due_date < CURRENT_DATE THEN amount ELSE 0 END) as overdue_amount
      FROM invoices
    `);
    
    const stats = result.rows[0];
    const creditResult = await pool.query(`SELECT * FROM credit_limits WHERE company_id = 1`);
    
    let credit_limit = { total_limit: 1000000000, used_amount: 0, available_balance: 1000000000 };
    if (creditResult.rows.length > 0) {
      const row = creditResult.rows[0];
      const tLimit = Number(row.credit_limit_amount || 0);
      const tUsed = Number(row.used_amount || 0);
      credit_limit = {
        total_limit: tLimit,
        used_amount: tUsed,
        available_balance: tLimit - tUsed
      };
    }

    const total_invoiced = Number(stats.total_invoiced || 0);
    const total_paid = Number(stats.total_paid || 0);

    res.json({
      success: true,
      summary: {
        total_invoiced: total_invoiced,
        total_paid: total_paid,
        total_unpaid: Number(stats.total_unpaid || 0),
        overdue_count: Number(stats.overdue_count || 0),
        overdue_amount: Number(stats.overdue_amount || 0),
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
    const result = await pool.query(`
      SELECT invoice_id, order_id, invoice_number, invoice_date, due_date, status, amount 
      FROM invoices 
      WHERE status = 'UNPAID' AND due_date < CURRENT_DATE
      ORDER BY due_date ASC
    `);

    const overdue = result.rows.map(row => ({
      invoice_id: row.invoice_id,
      invoice_number: row.invoice_number,
      issue_date: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : null,
      due_date: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
      status: row.status,
      amount: row.amount
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
    const userType = req.user?.user_type || 'BUYER_REP';
    const isBuyerRole = userType === 'BUYER_REP' || userType === 'BUYER';
    const companyId = req.user?.company_id;

    let query = `SELECT * FROM lc_documents WHERE 1=1 `;
    let params = [];

    if (isBuyerRole) {
      if (companyId) {
        query += ` AND buyer_company IN (SELECT company_name FROM companies WHERE company_id = $1) `;
        params.push(companyId);
      } else {
        query += ` AND 1=0 `;
      }
    }

    query += ` ORDER BY created_at DESC `;
    const result = await pool.query(query, params);
    
    const docs = result.rows.map(row => ({
      lc_id: row.lc_id,
      buyer_company: row.buyer_company,
      lc_number: row.lc_number,
      issuing_bank: row.issuing_bank,
      amount: row.amount,
      expiry_date: row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : null,
      document_url: row.document_url,
      status: row.status,
      created_at: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null
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
    let actualCompanyName = buyer_company;
    if (req.user && req.user.company_id) {
      const compRes = await pool.query('SELECT company_name FROM companies WHERE company_id = $1', [req.user.company_id]);
      if (compRes.rows.length > 0) {
        actualCompanyName = compRes.rows[0].company_name;
      }
    }
    if (!actualCompanyName) actualCompanyName = 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON';

    const result = await pool.query(`
        INSERT INTO lc_documents (buyer_company, lc_number, issuing_bank, amount, expiry_date, document_url, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED', CURRENT_TIMESTAMP)
        RETURNING lc_id
      `, [actualCompanyName, lc_number, issuing_bank, parseFloat(amount), new Date(expiry_date), docUrl]);

    const newLC = {
      lc_id: result.rows[0].lc_id,
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
  const lcid = parseInt(req.params.id);
  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
  }

  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const lcRes = await client.query('SELECT buyer_company, amount, status FROM lc_documents WHERE lc_id = $1', [lcid]);

      if (lcRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu L/C.' });
      }

      const lc = lcRes.rows[0];
      if (lc.status !== 'SUBMITTED') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Tài liệu L/C này đã được xử lý trước đó.' });
      }

      await client.query('UPDATE lc_documents SET status = $1 WHERE lc_id = $2', [status, lcid]);

      if (status === 'VERIFIED') {
        const compRes = await client.query('SELECT company_id FROM companies WHERE company_name = $1', [lc.buyer_company]);

        if (compRes.rows.length > 0) {
          const companyId = compRes.rows[0].company_id;
          
          const limitCheck = await client.query('SELECT company_id FROM credit_limits WHERE company_id = $1', [companyId]);

          if (limitCheck.rows.length > 0) {
            await client.query(`
                UPDATE credit_limits 
                SET credit_limit_amount = COALESCE(credit_limit_amount,0) + $1 
                WHERE company_id = $2
              `, [lc.amount, companyId]);
          } else {
            await client.query(`
                INSERT INTO credit_limits (company_id, credit_limit_amount, used_amount)
                VALUES ($1, $2, 0)
              `, [companyId, lc.amount]);
          }
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, message: `Đã cập nhật trạng thái L/C thành ${status}` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error verifying L/C doc:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xác thực L/C' });
  }
};

const rejectLCDocument = async (req, res) => {
  const lcid = parseInt(req.params.id);
  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const lcRes = await client.query('SELECT status FROM lc_documents WHERE lc_id = $1', [lcid]);

      if (lcRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu L/C.' });
      }

      if (lcRes.rows[0].status !== 'SUBMITTED') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Tài liệu L/C này đã được xử lý trước đó.' });
      }

      await client.query(`UPDATE lc_documents SET status = 'REJECTED' WHERE lc_id = $1`, [lcid]);

      await client.query('COMMIT');
      res.json({ success: true, message: `Đã từ chối L/C` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
