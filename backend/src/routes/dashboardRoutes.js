const express = require('express');
const router = express.Router();
const { getDashboardStats, getRevenueChart, getActivityFeed, getNotifications, markNotificationRead } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/revenue', getRevenueChart);
router.get('/dashboard/activity', getActivityFeed);
router.get('/dashboard/notifications', getNotifications);
router.post('/dashboard/notifications/:id/read', markNotificationRead);

module.exports = router;
