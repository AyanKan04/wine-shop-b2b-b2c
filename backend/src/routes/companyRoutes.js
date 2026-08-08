const express = require('express');
const router = express.Router();
const { registerCompany, getAdminLicenses, approveLicense, getCompanies, rejectLicense, toggleCompanyStatus } = require('../controllers/companyController');
const upload = require('../middlewares/upload');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// Company routes
router.post('/companies/register', upload.single('license_document'), registerCompany);
router.get('/companies', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'BUYER_REP', 'SALES_REP'), getCompanies);
router.put('/companies/:id/status', requireRole('PLATFORM_ADMIN'), toggleCompanyStatus);

// Admin License routes
router.get('/admin/licenses', requireRole('PLATFORM_ADMIN'), getAdminLicenses);
router.post('/admin/licenses/:id/approve', requireRole('PLATFORM_ADMIN'), approveLicense);
router.post('/admin/licenses/:id/reject', requireRole('PLATFORM_ADMIN'), rejectLicense);

module.exports = router;
