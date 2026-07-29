const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage } = require('../controllers/chatController');

router.get('/rfqs/:id/messages', getChatHistory);
router.post('/rfqs/:id/messages', sendMessage);

module.exports = router;
