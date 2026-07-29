const express = require('express');
const router = express.Router();
const { login, registerUser, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/register', registerUser);
router.get('/me', authenticateToken, getMe);

module.exports = router;
