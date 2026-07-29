const express = require('express');
const router = express.Router();
const { getOrders, getCreditLimit, payInvoice, updateCreditLimit, getFinancialSummary, getOverdueInvoices, getLCDocuments, submitLCDocument, verifyLCDocument, rejectLCDocument } = require('../controllers/financeController');

router.get('/orders', getOrders);
router.get('/finance/credit-limit', getCreditLimit);
router.post('/finance/pay-invoice/:id', payInvoice);
router.put('/finance/credit-limit', updateCreditLimit);
router.get('/finance/summary', getFinancialSummary);
router.get('/finance/overdue-invoices', getOverdueInvoices);

// L/C Documents endpoints
router.get('/finance/lc-documents', getLCDocuments);
router.post('/finance/lc-documents', submitLCDocument);
router.post('/finance/lc-documents/:id/verify', verifyLCDocument);
router.post('/finance/lc-documents/:id/reject', rejectLCDocument);

module.exports = router;
