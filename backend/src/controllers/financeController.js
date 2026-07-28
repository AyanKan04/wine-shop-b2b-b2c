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
    if (inv.status === 'PAID') {
      return res.json({ success: false, message: 'Hóa đơn này đã được thanh toán trước đó.' });
    }
    inv.status = 'PAID';
    dbMock.credit_limit.used_amount -= inv.amount;
    dbMock.credit_limit.available_balance += inv.amount;

    dbMock.activity_logs.unshift({
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      module: 'Finance',
      action: `Thanh toán hóa đơn ${inv.invoice_number} thành công (${(inv.amount / 1000000).toFixed(0)} Tr ₫)`,
      actor: 'Kế Toán',
      icon: 'fa-receipt',
      color: '#10B981'
    });

    return res.json({ success: true, message: 'Thanh toán hóa đơn thành công! Hạn mức khả dụng đã được khôi phục.' });
  }
  res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
};

// Update credit limit for a company
const updateCreditLimit = (req, res) => {
  const { total_limit } = req.body;
  const newLimit = parseFloat(total_limit);
  if (!newLimit || newLimit <= 0) {
    return res.status(400).json({ success: false, message: 'Hạn mức phải lớn hơn 0' });
  }

  const oldLimit = dbMock.credit_limit.total_limit;
  dbMock.credit_limit.total_limit = newLimit;
  dbMock.credit_limit.available_balance = newLimit - dbMock.credit_limit.used_amount;

  dbMock.activity_logs.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    module: 'Finance',
    action: `Điều chỉnh hạn mức tín dụng từ ${(oldLimit / 1000000000).toFixed(1)} Tỷ → ${(newLimit / 1000000000).toFixed(1)} Tỷ`,
    actor: 'Finance Admin',
    icon: 'fa-credit-card',
    color: '#D4AF37'
  });

  res.json({ success: true, message: `Đã cập nhật hạn mức tín dụng mới: ${(newLimit / 1000000000).toFixed(1)} Tỷ VNĐ`, credit: dbMock.credit_limit });
};

// Get financial summary
const getFinancialSummary = (req, res) => {
  const totalInvoiced = dbMock.invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = dbMock.invoices.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
  const totalUnpaid = dbMock.invoices.filter(i => i.status === 'UNPAID').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueInvoices = dbMock.invoices.filter(i => i.status === 'UNPAID' && new Date(i.due_date) < new Date());

  res.json({
    success: true,
    summary: {
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_unpaid: totalUnpaid,
      overdue_count: overdueInvoices.length,
      overdue_amount: overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      credit_limit: dbMock.credit_limit,
      payment_rate: totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0
    }
  });
};

// Get overdue invoices
const getOverdueInvoices = (req, res) => {
  const overdue = dbMock.invoices.filter(i => i.status === 'UNPAID' && new Date(i.due_date) < new Date());
  res.json({ success: true, data: overdue });
};

module.exports = {
  getOrders,
  getCreditLimit,
  payInvoice,
  updateCreditLimit,
  getFinancialSummary,
  getOverdueInvoices
};
