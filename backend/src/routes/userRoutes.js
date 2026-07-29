const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, lockUser } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

// Protect all user routes
router.use(authenticateToken);

// Platform Admin and Company Admin can manage users
router.get('/', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), getUsers);
router.post('/', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), createUser);
router.put('/:id', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), updateUser);
router.put('/:id/lock', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), lockUser);
router.delete('/:id', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), deleteUser);

module.exports = router;
