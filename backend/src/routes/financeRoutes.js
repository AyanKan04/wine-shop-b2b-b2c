const express = require('express');
const router = express.Router();
const { getOrders, getCreditLimit, payInvoice } = require('../controllers/financeController');

router.get('/orders', getOrders);
router.get('/finance/credit-limit', getCreditLimit);
router.post('/finance/pay-invoice/:id', payInvoice);

module.exports = router;
