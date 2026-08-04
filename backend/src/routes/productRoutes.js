const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateProductPrices } = require('../controllers/productController');
const { authenticateToken, requireRole, verifyAlcoholLicense } = require('../middlewares/authMiddleware');

// Protected product catalog endpoints (Decree 105/2017/ND-CP Compliance)
router.get('/', authenticateToken, verifyAlcoholLicense, getProducts);
router.get('/:id', authenticateToken, verifyAlcoholLicense, getProductById);

router.post('/', authenticateToken, requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), createProduct);
router.put('/:id', authenticateToken, requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), updateProduct);
router.post('/:id/prices', authenticateToken, requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'SALES_REP'), updateProductPrices);
router.delete('/:id', authenticateToken, requireRole('PLATFORM_ADMIN'), deleteProduct);

module.exports = router;
