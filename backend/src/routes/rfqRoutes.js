const express = require('express');
const router = express.Router();
const { getRFQs, createRFQ, getQuotations, createQuotation, updateQuotationStatus } = require('../controllers/rfqController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/rfqs', getRFQs);
router.post('/rfqs', createRFQ);
router.get('/sales/quotations', getQuotations);
router.post('/sales/quotations', createQuotation);
router.put('/sales/quotations/:id/status', updateQuotationStatus);

module.exports = router;
