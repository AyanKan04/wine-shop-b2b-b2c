const express = require('express');
const router = express.Router();
const { getInventory } = require('../controllers/warehouseController');

router.get('/warehouse/inventory', getInventory);

module.exports = router;
