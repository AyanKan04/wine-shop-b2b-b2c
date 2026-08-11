const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.delete('/cleanup', authenticateToken, async (req, res) => {
  const { type, companyId, rfqId, quotationId } = req.query;
  
  try {
    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (type === 'invoice' && quotationId) {
        const ord = await client.query(`SELECT order_id FROM orders WHERE quotation_id = $1`, [quotationId]);
        if (ord.rows.length > 0) {
           const orderId = ord.rows[0].order_id;
           await client.query(`DELETE FROM invoices WHERE order_id = $1`, [orderId]);
        }
      } else if (type === 'order' && quotationId) {
        const ord = await client.query(`SELECT order_id FROM orders WHERE quotation_id = $1`, [quotationId]);
        if (ord.rows.length > 0) {
           const orderId = ord.rows[0].order_id;
           await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);
           await client.query(`DELETE FROM orders WHERE order_id = $1`, [orderId]);
        }
      } else if (type === 'quotation' && quotationId) {
        await client.query(`DELETE FROM quotation_items WHERE quotation_id = $1`, [quotationId]);
        await client.query(`DELETE FROM quotations WHERE quotation_id = $1`, [quotationId]);
      } else if (type === 'rfq' && rfqId) {
        await client.query(`DELETE FROM rfq_items WHERE rfq_id = $1`, [rfqId]);
        await client.query(`DELETE FROM rfqs WHERE rfq_id = $1`, [rfqId]);
      } else if (type === 'company' && companyId) {
        await client.query(`DELETE FROM users WHERE company_id = $1`, [companyId]);
        await client.query(`DELETE FROM credit_limits WHERE company_id = $1`, [companyId]);
        await client.query(`DELETE FROM company_licenses WHERE company_id = $1`, [companyId]);
        await client.query(`DELETE FROM companies WHERE company_id = $1`, [companyId]);
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Test cleanup error:', err);
    res.status(500).json({ success: false, message: 'Lỗi dọn dẹp test' });
  }
});

module.exports = router;

