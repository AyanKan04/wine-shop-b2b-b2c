const { getPool, sql } = require('../config/db');

// Get dashboard KPI stats
const getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool();

    const orderRes = await pool.request().query(`SELECT ISNULL(SUM(TotalAmount), 0) as total_revenue FROM Orders`);
    const totalRevenue = orderRes.recordset[0].total_revenue;

    const prodRes = await pool.request().query(`SELECT COUNT(*) as count FROM Products`);
    const totalProducts = prodRes.recordset[0].count;

    const compRes = await pool.request().query(`SELECT COUNT(*) as count FROM Companies`);
    const totalCompanies = compRes.recordset[0].count;

    const licRes = await pool.request().query(`SELECT COUNT(*) as count FROM CompanyLicenses WHERE Status = 'PENDING_VERIFICATION'`);
    const pendingLicenses = licRes.recordset[0].count;

    const invRes = await pool.request().query(`SELECT ISNULL(SUM(QuantityOnHand), 0) as total_inventory FROM Inventories`);
    const totalInventory = invRes.recordset[0].total_inventory;

    const rfqRes = await pool.request().query(`SELECT COUNT(*) as count FROM RFQs WHERE Status = 'SUBMITTED'`);
    const activeRFQs = rfqRes.recordset[0].count;

    const invoiceRes = await pool.request().query(`
      SELECT COUNT(*) as unpaid_invoices, ISNULL(SUM(Amount), 0) as unpaid_amount 
      FROM Invoices WHERE Status = 'UNPAID'
    `);
    const unpaidInvoices = invoiceRes.recordset[0].unpaid_invoices;
    const unpaidAmount = invoiceRes.recordset[0].unpaid_amount;

    const shipRes = await pool.request().query(`SELECT COUNT(*) as count FROM Shipments WHERE ShipmentStatus != 'DELIVERED'`);
    const activeShipments = shipRes.recordset[0].count;

    const creditRes = await pool.request().query(`SELECT * FROM CreditLimits WHERE CompanyID = 1`);
    let credit_limit = { total_limit: 1000000000, used_amount: 0, available_balance: 1000000000 };
    if (creditRes.recordset.length > 0) {
      credit_limit = {
        total_limit: creditRes.recordset[0].CreditLimitAmount,
        used_amount: creditRes.recordset[0].UsedAmount,
        available_balance: creditRes.recordset[0].AvailableAmount
      };
    }

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
        credit_limit: credit_limit,
        active_shipments: activeShipments
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải thống kê' });
  }
};

// Get revenue chart data
const getRevenueChart = async (req, res) => {
  try {
    const pool = await getPool();
    
    // Doanh thu theo tháng
    const revQuery = `
      SELECT 
        'T' + CAST(MONTH(CreatedAt) AS VARCHAR) as month,
        SUM(TotalAmount) as revenue,
        COUNT(OrderID) as orders
      FROM Orders
      WHERE YEAR(CreatedAt) = YEAR(GETDATE())
      GROUP BY MONTH(CreatedAt)
      ORDER BY MONTH(CreatedAt)
    `;
    const revRes = await pool.request().query(revQuery);
    let monthly = revRes.recordset;

    // Top products
    const topProdQuery = `
      SELECT TOP 5
        p.ProductName as name,
        SUM(oi.Quantity * oi.UnitPrice) as revenue
      FROM OrderItems oi
      JOIN Products p ON oi.ProductID = p.ProductID
      JOIN Orders o ON oi.OrderID = o.OrderID
      GROUP BY p.ProductName
      ORDER BY revenue DESC
    `;
    const topProdRes = await pool.request().query(topProdQuery);
    
    let totalRevenue = monthly.reduce((sum, item) => sum + Number(item.revenue), 0);
    if (totalRevenue === 0) totalRevenue = 1; 
    
    const top_products = topProdRes.recordset.map(tp => ({
      name: tp.name.length > 20 ? tp.name.substring(0, 20) + '...' : tp.name,
      revenue: tp.revenue,
      percentage: Math.round((tp.revenue / totalRevenue) * 100)
    }));

    if (monthly.length === 0) {
      monthly = [{ month: 'T' + (new Date().getMonth() + 1), revenue: 0, orders: 0 }];
    }

    res.json({ success: true, data: { monthly, top_products } });
  } catch (err) {
    console.error('Error fetching revenue chart:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải biểu đồ doanh thu' });
  }
};

// Get activity feed
const getActivityFeed = async (req, res) => {
  try {
    const pool = await getPool();
    
    // Combine AuditLogs with Orders to generate a feed
    const query = `
      SELECT TOP 10 * FROM (
        SELECT 
          'ACT-' + CAST(LogID AS VARCHAR) as id,
          CreatedAt as timestamp,
          'Hệ Thống' as module,
          Action as action,
          'Admin' as actor,
          'fa-clock-rotate-left' as icon,
          '#6B7280' as color
        FROM AuditLogs
        
        UNION ALL
        
        SELECT 
          'ORD-' + CAST(OrderID AS VARCHAR) as id,
          CreatedAt as timestamp,
          'Bán Hàng' as module,
          'Đơn hàng mới ' + OrderNumber as action,
          'Khách hàng' as actor,
          'fa-cart-shopping' as icon,
          '#3B82F6' as color
        FROM Orders
        
        UNION ALL
        
        SELECT 
          'INV-' + CAST(InvoiceID AS VARCHAR) as id,
          InvoiceDate as timestamp,
          'Tài Chính' as module,
          'Hóa đơn ' + InvoiceNumber + ' - ' + Status as action,
          'Hệ thống' as actor,
          'fa-receipt' as icon,
          '#10B981' as color
        FROM Invoices
      ) as ActivityFeed
      ORDER BY timestamp DESC
    `;
    
    const result = await pool.request().query(query);
    
    // Format timestamp
    const activity_logs = result.recordset.map(log => {
      const d = new Date(log.timestamp);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return { ...log, timestamp: timeStr };
    });
    
    res.json({ success: true, data: activity_logs });
  } catch (err) {
    console.error('Error fetching activity feed:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải lịch sử hoạt động' });
  }
};

// Get notifications
const getNotifications = async (req, res) => {
  try {
    const pool = await getPool();
    
    // Generate dynamic notifications based on system state
    // 1. Unpaid invoices
    const invRes = await pool.request().query(`
      SELECT InvoiceNumber, DueDate FROM Invoices WHERE Status = 'UNPAID'
    `);
    
    // 2. Pending RFQs
    const rfqRes = await pool.request().query(`
      SELECT RFQID, Title, CreatedAt FROM RFQs WHERE Status = 'SUBMITTED'
    `);
    
    let notifications = [];
    
    invRes.recordset.forEach((inv, index) => {
      const days = Math.round((new Date(inv.DueDate) - new Date()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: 'NOTIF-INV-' + index,
        type: days < 7 ? 'warning' : 'info',
        title: 'Hóa đơn chưa thanh toán',
        message: `Hóa đơn ${inv.InvoiceNumber} cần thanh toán (còn ${days > 0 ? days : 0} ngày)`,
        read: false,
        timestamp: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})
      });
    });
    
    rfqRes.recordset.forEach((rfq, index) => {
      notifications.push({
        id: 'NOTIF-RFQ-' + index,
        type: 'info',
        title: 'Yêu cầu báo giá mới',
        message: `RFQ-${rfq.RFQID} đang chờ xử lý`,
        read: false,
        timestamp: new Date(rfq.CreatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})
      });
    });
    
    if (notifications.length === 0) {
      notifications = [
        { id: 'NOTIF-000', type: 'success', title: 'Hệ thống ổn định', message: 'Không có thông báo mới nào', read: true, timestamp: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) }
      ];
    }
    
    res.json({
      success: true,
      data: notifications,
      unread_count: notifications.filter(n => !n.read).length
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải thông báo' });
  }
};

// Mark notification as read
const markNotificationRead = (req, res) => {
  // In a dynamic setup, we might update a read status in DB, but since we generate dynamically, just return success
  res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
};

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getActivityFeed,
  getNotifications,
  markNotificationRead
};
