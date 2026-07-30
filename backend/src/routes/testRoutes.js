const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.delete('/cleanup', authenticateToken, async (req, res) => {
  const { type, companyId, rfqId, quotationId } = req.query;
  
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      if (type === 'invoice' && quotationId) {
        // Find order ID
        const ord = await transaction.request()
          .input('QuotationID', sql.BigInt, quotationId)
          .query(`SELECT OrderID FROM Orders WHERE QuotationID = @QuotationID`);
        if (ord.recordset.length > 0) {
           const orderId = ord.recordset[0].OrderID;
           await transaction.request().input('OrderID', sql.BigInt, orderId)
             .query(`DELETE FROM Invoices WHERE OrderID = @OrderID`);
        }
      } else if (type === 'order' && quotationId) {
        const ord = await transaction.request()
          .input('QuotationID', sql.BigInt, quotationId)
          .query(`SELECT OrderID FROM Orders WHERE QuotationID = @QuotationID`);
        if (ord.recordset.length > 0) {
           const orderId = ord.recordset[0].OrderID;
           await transaction.request().input('OrderID', sql.BigInt, orderId)
             .query(`DELETE FROM OrderItems WHERE OrderID = @OrderID`);
           await transaction.request().input('OrderID', sql.BigInt, orderId)
             .query(`DELETE FROM Orders WHERE OrderID = @OrderID`);
        }
      } else if (type === 'quotation' && quotationId) {
        await transaction.request().input('QuotationID', sql.BigInt, quotationId)
          .query(`DELETE FROM QuotationItems WHERE QuotationID = @QuotationID`);
        await transaction.request().input('QuotationID', sql.BigInt, quotationId)
          .query(`DELETE FROM Quotations WHERE QuotationID = @QuotationID`);
      } else if (type === 'rfq' && rfqId) {
        await transaction.request().input('RFQID', sql.BigInt, rfqId)
          .query(`DELETE FROM RFQs WHERE RFQID = @RFQID`);
      } else if (type === 'company' && companyId) {
        // Delete Users associated with Company
        await transaction.request().input('CompanyID', sql.BigInt, companyId)
          .query(`DELETE FROM Users WHERE CompanyID = @CompanyID`);
        // Delete CreditLimits
        await transaction.request().input('CompanyID', sql.BigInt, companyId)
          .query(`DELETE FROM CreditLimits WHERE CompanyID = @CompanyID`);
        // Delete Company
        await transaction.request().input('CompanyID', sql.BigInt, companyId)
          .query(`DELETE FROM Companies WHERE CompanyID = @CompanyID`);
      }

      await transaction.commit();
      res.json({ success: true });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Test cleanup error:', err);
    res.status(500).json({ success: false, message: 'Lỗi dọn dẹp test' });
  }
});

module.exports = router;
