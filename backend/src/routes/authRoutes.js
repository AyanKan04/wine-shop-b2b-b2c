const express = require('express');
const router = express.Router();
const { login, registerUser, getMe } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', registerUser);
router.get('/me', getMe);

module.exports = router;
