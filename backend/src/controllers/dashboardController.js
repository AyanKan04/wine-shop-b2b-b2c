const { dbMock } = require('../config/db');

// Get dashboard KPI stats
const getDashboardStats = (req, res) => {
  const totalRevenue = dbMock.orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalProducts = dbMock.products.length;
  const totalCompanies = dbMock.companies.length;
  const pendingLicenses = dbMock.licenses.filter(l => l.status === 'PENDING_VERIFICATION').length;
  const totalInventory = dbMock.inventory.reduce((sum, i) => sum + i.stock_on_hand, 0);
  const activeRFQs = dbMock.rfqs.filter(r => r.status === 'SUBMITTED').length;
  const unpaidInvoices = dbMock.invoices.filter(i => i.status === 'UNPAID').length;
  const unpaidAmount = dbMock.invoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0);

  res.json({
    success: true,
    stats: {
      total_revenue: totalRevenue,
      total_products: totalProducts,
      total_companies: totalCompanies,
      pending_licenses: pendingLicenses,
      total_inventory: totalInventory,
      active_rfqs: activeRFQs,
      unpaid_invoices: unpaidInvoices,
      unpaid_amount: unpaidAmount,
      credit_limit: dbMock.credit_limit,
      active_shipments: dbMock.shipments.filter(s => s.shipment_status !== 'DELIVERED').length
    }
  });
};

// Get revenue chart data
const getRevenueChart = (req, res) => {
  res.json({ success: true, data: dbMock.revenue_data });
};

// Get activity feed
const getActivityFeed = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ success: true, data: dbMock.activity_logs.slice(0, limit) });
};

// Get notifications
const getNotifications = (req, res) => {
  res.json({
    success: true,
    data: dbMock.notifications,
    unread_count: dbMock.notifications.filter(n => !n.read).length
  });
};

// Mark notification as read
const markNotificationRead = (req, res) => {
  const notif = dbMock.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    return res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  }
  res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
};

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getActivityFeed,
  getNotifications,
  markNotificationRead
};
