const { dbMock } = require('../config/db');

const getOrders = (req, res) => {
  res.json({ success: true, data: dbMock.orders });
};

const getCreditLimit = (req, res) => {
  res.json({ success: true, credit: dbMock.credit_limit, invoices: dbMock.invoices });
};

const payInvoice = (req, res) => {
  const inv = dbMock.invoices.find(i => i.invoice_id === parseInt(req.params.id));
  if (inv) {
    inv.status = 'PAID';
    dbMock.credit_limit.used_amount -= inv.amount;
    dbMock.credit_limit.available_balance += inv.amount;
    return res.json({ success: true, message: 'Thanh toán hóa đơn thành công! Hạn mức khả dụng đã được khôi phục.' });
  }
  res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
};

module.exports = {
  getOrders,
  getCreditLimit,
  payInvoice
};
