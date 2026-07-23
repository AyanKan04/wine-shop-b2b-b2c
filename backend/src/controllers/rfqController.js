const { dbMock } = require('../config/db');

// RFQs API
const getRFQs = (req, res) => {
  res.json({ success: true, data: dbMock.rfqs });
};

const createRFQ = (req, res) => {
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
  res.json({ success: true, message: 'Tạo Yêu cầu Báo giá RFQ thành công!', rfq: newRfq });
};

// Quotations API
const getQuotations = (req, res) => {
  res.json({ success: true, data: dbMock.quotations });
};

const createQuotation = (req, res) => {
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
  res.json({ success: true, message: 'Phát hành Bảng Báo Giá (Quotation) thành công!', quotation: newQuotation });
};

module.exports = {
  getRFQs,
  createRFQ,
  getQuotations,
  createQuotation
};
