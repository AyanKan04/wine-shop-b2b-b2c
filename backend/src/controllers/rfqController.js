const { getPool } = require('../config/db');

// RFQs API
const getRFQs = async (req, res) => {
  try {
    const pool = await getPool();
    const userType = req.user?.user_type || 'BUYER_REP';
    const isBuyerRole = userType === 'BUYER_REP' || userType === 'BUYER';
    
    let query = `
      SELECT r.*, c.company_name as buyer_company, p.product_name as db_product_name,
             (SELECT json_agg(ri.*) FROM rfq_items ri WHERE ri.rfq_id = r.rfq_id) as items
      FROM rfqs r
      LEFT JOIN companies c ON r.buyer_company_id = c.company_id
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE 1=1
    `;

    let params = [];
    if (isBuyerRole) {
      if (req.user?.company_id) {
        query += ` AND (r.buyer_company_id = $1 OR r.created_by = $2) `;
        params.push(req.user.company_id, req.user.user_id || 0);
      } else if (req.user?.user_id) {
        query += ` AND r.created_by = $1 `;
        params.push(req.user.user_id);
      } else {
        query += ` AND 1=0 `;
      }
    }

    query += ` ORDER BY r.created_at DESC `;
    const result = await pool.query(query, params);
    
    const rfqs = result.rows.map(row => {
      let items = row.items || [];
      return {
        rfq_id: row.rfq_id,
        buyer_company: row.buyer_company,
        title: row.title,
        product_name: row.db_product_name || row.description || 'Sản phẩm rượu',
        quantity: row.requested_quantity || (items.length > 0 ? items[0].quantity : 50),
        target_price: row.target_price || 70000000,
        status: row.status,
        created_at: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null
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
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let finalProductName = product_name;
      let finalProductId = productId;

      if (!finalProductName && finalProductId) {
        const prodQuery = await client.query('SELECT product_name FROM products WHERE product_id = $1', [finalProductId]);
        if (prodQuery.rows.length > 0) {
          finalProductName = prodQuery.rows[0].product_name;
        }
      }

      // If we don't have a valid product ID, let's find one by name
      if (finalProductName) {
        const prodQuery = await client.query('SELECT product_id FROM products WHERE product_name ILIKE $1', [`%${finalProductName}%`]);
        if (prodQuery.rows.length > 0) {
          finalProductId = prodQuery.rows[0].product_id;
        }
      }

      // If STILL no product ID, fallback to the first available product in the database
      if (!finalProductId || isNaN(finalProductId) || finalProductId === 101) {
        const firstProdQuery = await client.query('SELECT product_id, product_name FROM products LIMIT 1');
        if (firstProdQuery.rows.length > 0) {
          finalProductId = firstProdQuery.rows[0].product_id;
          if (!finalProductName) finalProductName = firstProdQuery.rows[0].product_name;
        }
      }

      if (!finalProductName) finalProductName = 'Sản phẩm rượu';

      const finalTitle = title || `Yêu cầu báo giá ${finalProductName}`;

      const buyerCompanyId = req.user && req.user.company_id ? req.user.company_id : 1;
      const createdBy = req.user && req.user.user_id ? req.user.user_id : 1;

      const rfqResult = await client.query(`
          INSERT INTO rfqs (buyer_company_id, created_by, title, description, status, created_at)
          VALUES ($1, $2, $3, $4, 'SUBMITTED', CURRENT_TIMESTAMP)
          RETURNING rfq_id, created_at
        `, [buyerCompanyId, createdBy, finalTitle, finalProductName]);

      const newId = rfqResult.rows[0].rfq_id;
      const createdAt = rfqResult.rows[0].created_at;

      await client.query(`
          INSERT INTO rfq_items (rfq_id, product_id, quantity, target_price)
          VALUES ($1, $2, $3, $4)
        `, [newId, finalProductId, qty, price]);

      await client.query('COMMIT');
      
      const newRfq = {
        rfq_id: newId,
        buyer_company: 'Công ty Khách Hàng',
        title: finalTitle,
        product_name: finalProductName,
        quantity: qty,
        target_price: price,
        status: 'SUBMITTED',
        created_at: new Date(createdAt).toISOString().split('T')[0]
      };

      res.status(201).json({ success: true, message: 'Tạo Yêu cầu Báo giá RFQ thành công!', rfq: newRfq });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating RFQ:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo RFQ', error: err.message, stack: err.stack });
  }
};

// Quotations API
const getQuotations = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT q.*, 
             bc.company_name as buyer_company, 
             sc.company_name as seller_company,
             (SELECT json_agg(qi.*) FROM quotation_items qi WHERE qi.quotation_id = q.quotation_id) as items
      FROM quotations q
      LEFT JOIN companies bc ON q.buyer_company_id = bc.company_id
      LEFT JOIN companies sc ON q.seller_company_id = sc.company_id
      ORDER BY q.created_at DESC
    `);
    
    const quotations = result.rows.map(row => {
      let items = row.items || [];
      return {
        quotation_id: row.quotation_id,
        rfq_id: row.rfq_id,
        buyer_company: row.buyer_company || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
        seller_company: row.seller_company || "MAISON DE L'ALCOOL RED APRON FACTORY",
        offer_unit_price: items.length > 0 ? items[0].offer_unit_price : 0,
        quantity: items.length > 0 ? items[0].quantity : 0,
        valid_until: row.valid_until ? new Date(row.valid_until).toISOString().split('T')[0] : '2026-12-31',
        status: row.status
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
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const rfqQuery = await client.query(`SELECT buyer_company_id, product_id, requested_quantity FROM rfqs WHERE rfq_id = $1`, [rfqId]);
      
      if (rfqQuery.rows.length === 0) {
        throw new Error('RFQ không tồn tại');
      }
      const rfq = rfqQuery.rows[0];
      const buyerCompanyId = rfq.buyer_company_id;
      let productId = req.body.product_id || rfq.product_id;
      
      if (!productId || isNaN(productId) || productId === 101) {
        const firstProdQuery = await client.query('SELECT product_id FROM products LIMIT 1');
        if (firstProdQuery.rows.length > 0) {
          productId = firstProdQuery.rows[0].product_id;
        }
      }

      const actualQty = qty || rfq.requested_quantity || 50;
      
      const sellerCompanyId = req.user && req.user.company_id ? req.user.company_id : 2;
      const createdBy = req.user && req.user.user_id ? req.user.user_id : 1;

      const qResult = await client.query(`
          INSERT INTO quotations (rfq_id, buyer_company_id, seller_company_id, created_by, status, valid_until, created_at)
          VALUES ($1, $2, $3, $4, 'PENDING', $5, CURRENT_TIMESTAMP)
          RETURNING quotation_id
        `, [rfqId, buyerCompanyId, sellerCompanyId, createdBy, new Date('2026-12-31')]);

      const newId = qResult.rows[0].quotation_id;

      await client.query(`
          INSERT INTO quotation_items (quotation_id, product_id, quantity, offer_unit_price)
          VALUES ($1, $2, $3, $4)
        `, [newId, productId, actualQty, price]);

      await client.query(`UPDATE rfqs SET status = 'QUOTATION_SENT' WHERE rfq_id = $1`, [rfqId]);

      await client.query('COMMIT');
      
      const newQuotation = {
        quotation_id: newId,
        rfq_id: rfqId,
        buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
        seller_company: "MAISON DE L'ALCOOL RED APRON FACTORY",
        offer_unit_price: price,
        quantity: actualQty,
        valid_until: '2026-12-31',
        status: 'PENDING'
      };

      res.status(201).json({ success: true, message: 'Phát hành Bảng Báo Giá (Quotation) thành công!', quotation: newQuotation });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating quotation:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo báo giá' });
  }
};

const updateQuotationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const quotationId = parseInt(id);

  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const qCheck = await client.query(`
          SELECT q.rfq_id, q.buyer_company_id, q.seller_company_id, q.status, qi.product_id, qi.offer_unit_price, qi.quantity 
          FROM quotations q
          LEFT JOIN quotation_items qi ON q.quotation_id = qi.quotation_id
          WHERE q.quotation_id = $1
        `, [quotationId]);
      
      if (qCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo giá' });
      }

      const qData = qCheck.rows[0];

      if (req.user?.company_id && qData.buyer_company_id !== req.user.company_id && req.user.user_type !== 'PLATFORM_ADMIN') {
         await client.query('ROLLBACK');
         return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên báo giá này.' });
      }
      
      if (qData.status === 'ACCEPTED') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Báo giá này đã được chấp nhận từ trước.' });
      }

      const rfqId = qData.rfq_id;
      const totalAmount = (qData.offer_unit_price || 0) * (qData.quantity || 0);

      const statusUpdateRes = await client.query(`UPDATE quotations SET status = $1 WHERE quotation_id = $2 AND status != 'ACCEPTED'`, [status, quotationId]);
      
      if (statusUpdateRes.rowCount === 0) {
         await client.query('ROLLBACK');
         return res.status(400).json({ success: false, message: 'Báo giá này đã được xử lý (hoặc đã được chấp nhận) trước đó.' });
      }

      if (status === 'ACCEPTED') {
        const creditCheck = await client.query('SELECT credit_limit_amount, used_amount FROM credit_limits WHERE company_id = $1', [qData.buyer_company_id]);
        
        if (creditCheck.rows.length > 0) {
          const limit = Number(creditCheck.rows[0].credit_limit_amount || 0);
          const used = Number(creditCheck.rows[0].used_amount || 0);
          if (used + totalAmount > limit) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: `Hạn mức tín dụng không đủ để hoàn tất đơn hàng. Còn lại: ${(limit - used).toLocaleString('vi-VN')} VNĐ.` });
          }
        }

        const overdueCheck = await client.query(`
            SELECT COUNT(*) as overdue_count 
            FROM invoices i
            JOIN orders o ON i.order_id = o.order_id
            WHERE o.buyer_company_id = $1 AND i.status = 'UNPAID' AND i.due_date < CURRENT_TIMESTAMP
          `, [qData.buyer_company_id]);
        
        if (overdueCheck.rows.length > 0 && Number(overdueCheck.rows[0].overdue_count) > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: 'Tài khoản sỉ bị tạm khóa chức năng mua nợ Net-30 do có hóa đơn quá hạn chưa thanh toán.' });
        }

        let prodId = qData.product_id;
        
        if (!prodId || isNaN(prodId) || prodId === 101) {
          const firstProdQuery = await client.query('SELECT product_id FROM products LIMIT 1');
          if (firstProdQuery.rows.length > 0) {
            prodId = firstProdQuery.rows[0].product_id;
          }
        }
        const stockReserveResult = await client.query(`
            UPDATE inventories 
            SET reserved_quantity = reserved_quantity + $1 
            WHERE product_id = $2 AND (quantity_on_hand - reserved_quantity) >= $1
          `, [qData.quantity, prodId]);

        if (stockReserveResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: 'Số lượng hàng tồn kho khả dụng không đủ để đáp ứng đơn hàng này.' });
        }

        const orderNumber = `ORD-2026-${8800 + quotationId}`;
        const createdBy = req.user && req.user.user_id ? req.user.user_id : 1;
        
        const ordRes = await client.query(`
            INSERT INTO orders (buyer_company_id, seller_company_id, quotation_id, order_number, order_status, payment_method, total_amount, created_by, created_at)
            VALUES ($1, $2, $3, $4, 'PROCESSING', 'NET_30_CREDIT', $5, $6, CURRENT_TIMESTAMP)
            RETURNING order_id
          `, [qData.buyer_company_id, qData.seller_company_id, quotationId, orderNumber, totalAmount, createdBy]);
        
        const orderId = ordRes.rows[0].order_id;

        await client.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            VALUES ($1, $2, $3, $4)
          `, [orderId, prodId, qData.quantity, qData.offer_unit_price]);

        const invoiceNumber = `INV-2026-${8800 + quotationId}`;
        await client.query(`
            INSERT INTO invoices (order_id, invoice_number, invoice_date, due_date, status, amount)
            VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'UNPAID', $3)
          `, [orderId, invoiceNumber, totalAmount]);

        await client.query(`
            UPDATE credit_limits 
            SET used_amount = COALESCE(used_amount, 0) + $1
            WHERE company_id = $2
          `, [totalAmount, qData.buyer_company_id]);

        await client.query(`UPDATE rfqs SET status = 'ACCEPTED' WHERE rfq_id = $1`, [rfqId]);

      } else {
        await client.query(`UPDATE rfqs SET status = 'SUBMITTED' WHERE rfq_id = $1`, [rfqId]);
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        message: `Đã cập nhật trạng thái báo giá sang: ${status}`
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
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
    const result = await pool.query(`UPDATE rfqs SET status = $1 WHERE rfq_id = $2`, [status, rfqId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy RFQ' });
    }

    // Insert Audit Log (assuming audit_logs table exists)
    try {
      await pool.query(`INSERT INTO audit_logs (user_id, action, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`, [req.user?.user_id || 1, `Chuyển cơ hội RFQ-${rfqId} sang trạng thái: ${status}`]);
    } catch(e) {} // ignore if audit_logs doesn't exist

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
