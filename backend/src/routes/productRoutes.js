const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateProductPrices } = require('../controllers/productController');
const { authenticateToken, optionalAuth, requireRole, verifyAlcoholLicense } = require('../middlewares/authMiddleware');

// Product catalog endpoints
router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProductById);

router.post('/', authenticateToken, requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), createProduct);
router.put('/:id', authenticateToken, requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), updateProduct);
router.post('/batch-prices', authenticateToken, requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'SALES_REP'), updateProductPrices);
router.post('/:id/prices', authenticateToken, requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'SALES_REP'), updateProductPrices);
router.delete('/:id', authenticateToken, requireRole('PLATFORM_ADMIN'), deleteProduct);

module.exports = router;
