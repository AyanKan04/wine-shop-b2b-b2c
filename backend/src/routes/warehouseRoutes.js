const express = require('express');
const router = express.Router();
const { getInventory, adjustStock, getShipments, createShipment, updateShipmentStatus } = require('../controllers/warehouseController');

router.get('/warehouse/inventory', getInventory);
router.post('/warehouse/inventory/adjust', adjustStock);
router.get('/warehouse/shipments', getShipments);
router.post('/warehouse/shipments', createShipment);
router.put('/warehouse/shipments/:id/status', updateShipmentStatus);

module.exports = router;
