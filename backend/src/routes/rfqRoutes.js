const express = require('express');
const router = express.Router();
const { getRFQs, createRFQ, updateRFQStatus, getQuotations, createQuotation, updateQuotationStatus } = require('../controllers/rfqController');
const { authenticateToken, verifyAlcoholLicense } = require('../middlewares/authMiddleware');

router.use(authenticateToken);
router.use(verifyAlcoholLicense);

router.get('/rfqs', getRFQs);
router.post('/rfqs', createRFQ);
router.put('/rfqs/:id/status', updateRFQStatus);
router.get('/sales/quotations', getQuotations);
router.post('/sales/quotations', createQuotation);
router.put('/sales/quotations/:id/status', updateQuotationStatus);

module.exports = router;
