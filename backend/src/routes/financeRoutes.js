const express = require('express');
const router = express.Router();
const { getOrders, getCreditLimit, payInvoice, updateCreditLimit, getFinancialSummary, getOverdueInvoices } = require('../controllers/financeController');

router.get('/orders', getOrders);
router.get('/finance/credit-limit', getCreditLimit);
router.post('/finance/pay-invoice/:id', payInvoice);
router.put('/finance/credit-limit', updateCreditLimit);
router.get('/finance/summary', getFinancialSummary);
router.get('/finance/overdue-invoices', getOverdueInvoices);

module.exports = router;
