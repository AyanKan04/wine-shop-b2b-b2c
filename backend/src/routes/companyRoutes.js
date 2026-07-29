const express = require('express');
const router = express.Router();
const { registerCompany, getAdminLicenses, approveLicense } = require('../controllers/companyController');
const upload = require('../middlewares/upload');

// Company routes
router.post('/companies/register', upload.single('license_document'), registerCompany);

// Admin License routes
router.get('/admin/licenses', getAdminLicenses);
router.post('/admin/licenses/:id/approve', approveLicense);

module.exports = router;
