const express = require('express');
const router = express.Router();
const { getRFQs, createRFQ, getQuotations, createQuotation } = require('../controllers/rfqController');

router.get('/rfqs', getRFQs);
router.post('/rfqs', createRFQ);
router.get('/sales/quotations', getQuotations);
router.post('/sales/quotations', createQuotation);

module.exports = router;
