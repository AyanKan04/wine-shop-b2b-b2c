const { 
  dbMock, 
  persistRFQ, 
  persistQuotation, 
  updateQuotationStatus: dbUpdateQuotationStatus, 
  persistOrder, 
  persistInvoice, 
  updateCreditLimit 
} = require('../config/db');

// RFQs API
const getRFQs = (req, res) => {
  res.json({ success: true, data: dbMock.rfqs });
};

const createRFQ = async (req, res) => {
  const { product_name, quantity, target_price } = req.body;
  const newRfq = {
    rfq_id: 8800 + dbMock.rfqs.length + 1,
    buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
    title: `Yêu cầu báo giá ${product_name}`,
    product_name,
    quantity: parseInt(quantity) || 50,
    target_price: parseFloat(target_price) || 70000000,
    status: 'SUBMITTED',
    created_at: new Date().toISOString().split('T')[0]
  };
  dbMock.rfqs.push(newRfq);

  // Persist RFQ to SQL Server database
  await persistRFQ(newRfq);

  res.json({ success: true, message: 'Tạo Yêu cầu Báo giá RFQ thành công!', rfq: newRfq });
};

// Quotations API
const getQuotations = (req, res) => {
  res.json({ success: true, data: dbMock.quotations });
};

const createQuotation = async (req, res) => {
  const { rfq_id, offer_unit_price, quantity } = req.body;
  const newQuotation = {
    quotation_id: 9900 + dbMock.quotations.length + 1,
    rfq_id: parseInt(rfq_id),
    buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
    seller_company: 'MAISON DE L\'ALCOOL RED APRON FACTORY',
    offer_unit_price: parseFloat(offer_unit_price),
    quantity: parseInt(quantity),
    valid_until: '2026-08-30',
    status: 'PENDING'
  };
  dbMock.quotations.push(newQuotation);

  // Update RFQ status to show quotation was sent
  const rfq = dbMock.rfqs.find(r => r.rfq_id === parseInt(rfq_id));
  if (rfq) {
    rfq.status = 'QUOTATION_SENT';
  }

  // Persist Quotation to SQL Server database
  await persistQuotation(newQuotation);

  res.json({ success: true, message: 'Phát hành Bảng Báo Giá (Quotation) thành công!', quotation: newQuotation });
};

// Update Quotation status (ACCEPT/REJECT) and trigger B2B Order workflow
const updateQuotationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'ACCEPTED' | 'REJECTED'

  const quotation = dbMock.quotations.find(q => q.quotation_id === parseInt(id));
  if (!quotation) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy báo giá' });
  }

  quotation.status = status;

  if (status === 'ACCEPTED') {
    const totalAmount = quotation.offer_unit_price * quotation.quantity;
    const orderNumber = `ORD-2026-${8800 + quotation.rfq_id}`;
    
    // 1. Create a new B2B Order
    const newOrder = {
      order_id: 500 + dbMock.orders.length + 1,
      order_number: orderNumber,
      buyer_company: quotation.buyer_company,
      total_amount: totalAmount,
      order_status: 'PROCESSING',
      payment_method: 'NET_30_CREDIT',
      payment_status: 'UNPAID',
      created_at: new Date().toISOString().split('T')[0]
    };
    dbMock.orders.push(newOrder);

    // 2. Create invoice
    const newInvoice = {
      invoice_id: 100 + dbMock.invoices.length + 1,
      invoice_number: `INV-2026-0${quotation.quotation_id}`,
      order_number: orderNumber,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      amount: totalAmount,
      status: 'UNPAID'
    };
    dbMock.invoices.push(newInvoice);

    // 3. Update Credit Limit usage
    dbMock.credit_limit.used_amount += totalAmount;
    dbMock.credit_limit.available_balance = dbMock.credit_limit.total_limit - dbMock.credit_limit.used_amount;

    // 4. Update corresponding RFQ status to ACCEPTED
    const rfq = dbMock.rfqs.find(r => r.rfq_id === quotation.rfq_id);
    if (rfq) {
      rfq.status = 'ACCEPTED';
    }

    // 5. Add to system activities
    dbMock.activity_logs.unshift({
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      module: 'CRM',
      action: `Chấp nhận báo giá QUOT-${quotation.quotation_id} - Tạo đơn hàng ${orderNumber}`,
      actor: 'Buyer Rep',
      icon: 'fa-file-signature',
      color: '#10B981'
    });

    // 6. Persist ACCEPTED Quotation, new Order, Invoice, and Credit Limit to SQL Server
    await dbUpdateQuotationStatus(quotation.quotation_id, 'ACCEPTED');
    await persistOrder(newOrder);
    await persistInvoice(newInvoice);
    await updateCreditLimit(dbMock.credit_limit);

  } else {
    // Rejected
    const rfq = dbMock.rfqs.find(r => r.rfq_id === quotation.rfq_id);
    if (rfq) {
      rfq.status = 'SUBMITTED'; // Reset RFQ status back to submitted to allow re-quoting
    }

    dbMock.activity_logs.unshift({
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      module: 'CRM',
      action: `Từ chối báo giá QUOT-${quotation.quotation_id}`,
      actor: 'Buyer Rep',
      icon: 'fa-file-excel',
      color: '#EF4444'
    });

    // Persist REJECTED Quotation to SQL Server
    await dbUpdateQuotationStatus(quotation.quotation_id, 'REJECTED');
  }

  res.json({
    success: true,
    message: `Đã cập nhật trạng thái báo giá sang: ${status}`,
    quotation,
    credit: dbMock.credit_limit,
    orders: dbMock.orders,
    invoices: dbMock.invoices
  });
};

module.exports = {
  getRFQs,
  createRFQ,
  getQuotations,
  createQuotation,
  updateQuotationStatus
};
