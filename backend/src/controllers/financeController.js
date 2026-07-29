const { 
  dbMock, 
  persistLC, 
  updateLCStatus, 
  updateCreditLimit: dbUpdateCreditLimit, 
  updateInvoiceStatus 
} = require('../config/db');

const getOrders = (req, res) => {
  const mappedOrders = dbMock.orders.map(order => {
    const inv = dbMock.invoices.find(i => i.order_number === order.order_number);
    return {
      ...order,
      payment_status: inv ? inv.status : (order.payment_status || 'UNPAID')
    };
  });
  res.json({ success: true, data: mappedOrders });
};

const getCreditLimit = (req, res) => {
  res.json({ success: true, credit: dbMock.credit_limit, invoices: dbMock.invoices });
};

const payInvoice = async (req, res) => {
  const inv = dbMock.invoices.find(i => i.invoice_id === parseInt(req.params.id));
  if (inv) {
    if (inv.status === 'PAID') {
      return res.json({ success: false, message: 'Hóa đơn này đã được thanh toán trước đó.' });
    }
    inv.status = 'PAID';
    dbMock.credit_limit.used_amount -= inv.amount;
    dbMock.credit_limit.available_balance += inv.amount;

    // Direct update to corresponding order in database mock
    const order = dbMock.orders.find(o => o.order_number === inv.order_number);
    if (order) {
      order.payment_status = 'PAID';
    }

    dbMock.activity_logs.unshift({
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      module: 'Finance',
      action: `Thanh toán hóa đơn ${inv.invoice_number} thành công (${(inv.amount / 1000000).toFixed(0)} Tr ₫)`,
      actor: 'Kế Toán',
      icon: 'fa-receipt',
      color: '#10B981'
    });

    // Persist invoice status & credit limit to SQL Server
    await updateInvoiceStatus(inv.invoice_id, 'PAID');
    await dbUpdateCreditLimit(dbMock.credit_limit);

    return res.json({ success: true, message: 'Thanh toán hóa đơn thành công! Hạn mức khả dụng đã được khôi phục.' });
  }
  res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
};

// Update credit limit for a company
const updateCreditLimit = async (req, res) => {
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

  // Persist new credit limit to SQL Server
  await dbUpdateCreditLimit(dbMock.credit_limit);

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

const getLCDocuments = (req, res) => {
  res.json({ success: true, data: dbMock.lc_documents || [] });
};

const submitLCDocument = async (req, res) => {
  const { lc_number, issuing_bank, amount, expiry_date } = req.body;
  if (!lc_number || !issuing_bank || !amount || !expiry_date) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin L/C.' });
  }

  // Set document URL from Multer upload or request fallback
  const docUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.document_url || '/uploads/lc_default.pdf');

  const newLC = {
    lc_id: (dbMock.lc_documents || []).length + 1,
    buyer_company: req.body.buyer_company || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
    lc_number,
    issuing_bank,
    amount: parseFloat(amount),
    expiry_date,
    document_url: docUrl,
    status: 'SUBMITTED',
    created_at: new Date().toISOString().slice(0, 10)
  };

  if (!dbMock.lc_documents) {
    dbMock.lc_documents = [];
  }
  dbMock.lc_documents.push(newLC);

  dbMock.activity_logs.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    module: 'Finance',
    action: `Doanh nghiệp nộp Thư tín dụng L/C mới: ${lc_number} (${(amount / 1000000).toFixed(0)} Tr ₫)`,
    actor: 'Khách Hàng B2B',
    icon: 'fa-file-invoice-dollar',
    color: '#8B5CF6'
  });

  // Persist L/C document to SQL Server
  await persistLC(newLC);

  res.json({ success: true, message: 'Đăng ký L/C thành công! Đang chờ Kế toán trưởng thẩm định.', data: newLC });
};

const verifyLCDocument = async (req, res) => {
  const lc = (dbMock.lc_documents || []).find(doc => doc.lc_id === parseInt(req.params.id));
  if (!lc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu L/C' });
  }

  if (lc.status !== 'SUBMITTED') {
    return res.status(400).json({ success: false, message: 'Tài liệu L/C này đã được xử lý từ trước.' });
  }

  lc.status = 'VERIFIED';
  // Increase credit limits
  dbMock.credit_limit.total_limit += lc.amount;
  dbMock.credit_limit.available_balance += lc.amount;

  dbMock.activity_logs.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    module: 'Finance',
    action: `Phê duyệt Thư tín dụng L/C: ${lc.lc_number} (+ ${(lc.amount / 1000000000).toFixed(1)} Tỷ hạn mức)`,
    actor: 'Kế Toán Trưởng',
    icon: 'fa-shield-check',
    color: '#10B981'
  });

  // Persist updates to SQL Server
  await updateLCStatus(lc.lc_id, 'VERIFIED');
  await dbUpdateCreditLimit(dbMock.credit_limit);

  res.json({ success: true, message: 'Phê duyệt L/C thành công! Hạn mức tín dụng của doanh nghiệp đã được nâng cao.', data: lc });
};

const rejectLCDocument = async (req, res) => {
  const lc = (dbMock.lc_documents || []).find(doc => doc.lc_id === parseInt(req.params.id));
  if (!lc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu L/C' });
  }

  if (lc.status !== 'SUBMITTED') {
    return res.status(400).json({ success: false, message: 'Tài liệu L/C này đã được xử lý từ trước.' });
  }

  lc.status = 'REJECTED';

  dbMock.activity_logs.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    module: 'Finance',
    action: `Từ chối tài liệu L/C bảo lãnh: ${lc.lc_number}`,
    actor: 'Kế Toán Trưởng',
    icon: 'fa-circle-xmark',
    color: '#EF4444'
  });

  // Persist status to SQL Server
  await updateLCStatus(lc.lc_id, 'REJECTED');

  res.json({ success: true, message: 'Đã từ chối tài liệu L/C bảo lãnh thành công.', data: lc });
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
