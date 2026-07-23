const express = require('express');
const router = express.Router();
const { registerCompany, getAdminLicenses, approveLicense } = require('../controllers/companyController');

// Company routes
router.post('/register', registerCompany);

// Admin License routes
router.get('/admin/licenses', getAdminLicenses);
router.post('/admin/licenses/:id/approve', approveLicense);

module.exports = router;
