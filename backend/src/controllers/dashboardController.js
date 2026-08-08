const { getPool } = require('../config/db');

// Get dashboard KPI stats
const getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool();

    const orderRes = await pool.query(`SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM orders`);
    const totalRevenue = orderRes.rows[0].total_revenue;

    const prodRes = await pool.query(`SELECT COUNT(*) as count FROM products`);
    const totalProducts = prodRes.rows[0].count;

    const compRes = await pool.query(`SELECT COUNT(*) as count FROM companies`);
    const totalCompanies = compRes.rows[0].count;

    const licRes = await pool.query(`SELECT COUNT(*) as count FROM company_licenses WHERE status = 'PENDING_VERIFICATION'`);
    const pendingLicenses = licRes.rows[0].count;

    const invRes = await pool.query(`SELECT COALESCE(SUM(quantity_on_hand), 0) as total_inventory FROM inventories`);
    const totalInventory = invRes.rows[0].total_inventory;

    const rfqRes = await pool.query(`SELECT COUNT(*) as count FROM rfqs WHERE status = 'SUBMITTED'`);
    const activeRFQs = rfqRes.rows[0].count;

    const invoiceRes = await pool.query(`
      SELECT COUNT(*) as unpaid_invoices, COALESCE(SUM(amount), 0) as unpaid_amount 
      FROM invoices WHERE status = 'UNPAID'
    `);
    const unpaidInvoices = invoiceRes.rows[0].unpaid_invoices;
    const unpaidAmount = invoiceRes.rows[0].unpaid_amount;

    const shipRes = await pool.query(`SELECT COUNT(*) as count FROM shipments WHERE shipment_status != 'DELIVERED'`);
    const activeShipments = shipRes.rows[0].count;

    const creditRes = await pool.query(`SELECT * FROM credit_limits WHERE company_id = 1`);
    let credit_limit = { total_limit: 1000000000, used_amount: 0, available_balance: 1000000000 };
    if (creditRes.rows.length > 0) {
      const limit = Number(creditRes.rows[0].credit_limit_amount || 0);
      const used = Number(creditRes.rows[0].used_amount || 0);
      credit_limit = {
        total_limit: limit,
        used_amount: used,
        available_balance: limit - used
      };
    }

    res.json({
      success: true,
      stats: {
        total_revenue: Number(totalRevenue),
        total_products: Number(totalProducts),
        total_companies: Number(totalCompanies),
        pending_licenses: Number(pendingLicenses),
        total_inventory: Number(totalInventory),
        active_rfqs: Number(activeRFQs),
        unpaid_invoices: Number(unpaidInvoices),
        unpaid_amount: Number(unpaidAmount),
        credit_limit: credit_limit,
        active_shipments: Number(activeShipments)
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
        'T' || EXTRACT(MONTH FROM created_at) as month,
        SUM(total_amount) as revenue,
        COUNT(order_id) as orders
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
    `;
    const revRes = await pool.query(revQuery);
    let monthly = revRes.rows;

    // Top products
    const topProdQuery = `
      SELECT 
        p.product_name as name,
        SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      GROUP BY p.product_name
      ORDER BY revenue DESC
      LIMIT 5
    `;
    const topProdRes = await pool.query(topProdQuery);
    
    let totalRevenue = monthly.reduce((sum, item) => sum + Number(item.revenue), 0);
    if (totalRevenue === 0) totalRevenue = 1; 
    
    const top_products = topProdRes.rows.map(tp => ({
      name: tp.name.length > 20 ? tp.name.substring(0, 20) + '...' : tp.name,
      revenue: Number(tp.revenue),
      percentage: Math.round((Number(tp.revenue) / totalRevenue) * 100)
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
    
    const query = `
      SELECT * FROM (
        SELECT 
          'RFQ-' || rfq_id as id,
          created_at as timestamp,
          'Đàm Phán RFQ' as module,
          'Yêu cầu báo giá RFQ-' || rfq_id || ' (' || status || ')' as action,
          'Đối Tác B2B' as actor,
          'fa-file-signature' as icon,
          '#F59E0B' as color
        FROM rfqs
        
        UNION ALL
        
        SELECT 
          'ORD-' || order_id as id,
          created_at as timestamp,
          'Bán Hàng' as module,
          'Đơn hàng mới ' || order_number as action,
          'Khách hàng' as actor,
          'fa-cart-shopping' as icon,
          '#3B82F6' as color
        FROM orders
        
        UNION ALL
        
        SELECT 
          'INV-' || invoice_id as id,
          invoice_date::timestamp as timestamp,
          'Tài Chính' as module,
          'Hóa đơn ' || invoice_number || ' - ' || status as action,
          'Hệ thống' as actor,
          'fa-receipt' as icon,
          '#10B981' as color
        FROM invoices
      ) as ActivityFeed
      ORDER BY timestamp DESC
      LIMIT 15
    `;
    
    const result = await pool.query(query);
    
    // Format timestamp
    const activity_logs = result.rows.map(log => {
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
    const companyId = req.user?.company_id;
    const userId = req.user?.user_id;
    const userType = req.user?.user_type || 'BUYER_REP';
    const isBuyerRole = userType === 'BUYER' || userType === 'BUYER_REP';
    let notifications = [];

    let cid = companyId;
    if (isBuyerRole && !cid && userId) {
      const uRes = await pool.query('SELECT company_id FROM users WHERE user_id = $1', [userId]);
      cid = uRes.rows[0]?.company_id;
    }

    if (isBuyerRole) {
      if (cid) {
      // 1. Unpaid invoices FOR THIS BUYER COMPANY ONLY
      const invRes = await pool.query(`
          SELECT i.invoice_number, i.due_date, i.amount 
          FROM invoices i
          JOIN orders o ON i.order_id = o.order_id
          WHERE o.buyer_company_id = $1 AND i.status != 'PAID'
        `, [cid]);

      invRes.rows.forEach((inv, index) => {
        const days = Math.round((new Date(inv.due_date) - new Date()) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: 'NOTIF-BUYER-INV-' + index,
          type: days < 5 ? 'warning' : 'info',
          title: 'Hóa đơn cần thanh toán Net-30',
          message: `Hóa đơn ${inv.invoice_number} (${(Number(inv.amount)).toLocaleString('vi-VN')} đ) đến hạn trong ${days > 0 ? days : 0} ngày`,
          read: false,
          timestamp: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute:'2-digit' })
        });
      });

      // 2. RFQ status updates FOR THIS BUYER USER ONLY
      const rfqRes = await pool.query(`
          SELECT rfq_id, title, status, created_at 
          FROM rfqs 
          WHERE created_by = $1 OR buyer_company_id = $2
        `, [userId || 0, cid]);

      rfqRes.rows.forEach((rfq, index) => {
        let statusText = 'đang chờ xử lý';
        if (rfq.status === 'QUOTED') statusText = 'đã có Báo giá mới từ Sales!';
        if (rfq.status === 'ACCEPTED') statusText = 'đã được chấp nhận!';
        
        const rfqDate = rfq.created_at ? new Date(rfq.created_at) : new Date();
        let timeStr = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute:'2-digit' });
        if (rfq.created_at && !isNaN(rfqDate.getTime())) {
          timeStr = rfqDate.toISOString().substring(11, 16);
        }

        notifications.push({
          id: 'NOTIF-BUYER-RFQ-' + index,
          type: rfq.status === 'QUOTED' ? 'success' : 'info',
          title: `Cập nhật báo giá RFQ-${rfq.rfq_id}`,
          message: `Yêu cầu báo giá "${rfq.title || 'Báo giá Rượu'}" ${statusText}`,
          read: false,
          timestamp: timeStr
        });
      });
      }
    } else {
      // ADMIN / SALES_REP System Notifications
      const invRes = await pool.query(`
        SELECT i.invoice_number, i.due_date, bc.company_name 
        FROM invoices i
        JOIN orders o ON i.order_id = o.order_id
        LEFT JOIN companies bc ON o.buyer_company_id = bc.company_id
        WHERE i.status != 'PAID'
      `);
      
      const rfqRes = await pool.query(`
        SELECT r.rfq_id, r.title, r.created_at, bc.company_name 
        FROM rfqs r
        LEFT JOIN companies bc ON r.buyer_company_id = bc.company_id
        WHERE r.status = 'SUBMITTED'
      `);

      invRes.rows.forEach((inv, index) => {
        const days = Math.round((new Date(inv.due_date) - new Date()) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: 'NOTIF-ADM-INV-' + index,
          type: days < 7 ? 'warning' : 'info',
          title: 'Hóa đơn chưa thu tiền',
          message: `Hóa đơn ${inv.invoice_number} (${inv.company_name || 'Khách B2B'}) chờ thu hồi nợ`,
          read: false,
          timestamp: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute:'2-digit' })
        });
      });
      
      rfqRes.rows.forEach((rfq, index) => {
        const rfqDate = rfq.created_at ? new Date(rfq.created_at) : new Date();
        let timeStr = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute:'2-digit' });
        if (rfq.created_at && !isNaN(rfqDate.getTime())) {
          timeStr = rfqDate.toISOString().substring(11, 16);
        }

        notifications.push({
          id: 'NOTIF-ADM-RFQ-' + index,
          type: 'info',
          title: 'RFQ mới cần báo giá',
          message: `RFQ-${rfq.rfq_id} từ ${rfq.company_name || 'Khách B2B'} đang chờ phát hành quotation`,
          read: false,
          timestamp: timeStr
        });
      });
    }

    if (notifications.length === 0) {
      notifications = [
        { id: 'NOTIF-000', type: 'success', title: 'Hệ thống ổn định', message: 'Không có thông báo mới nào', read: true, timestamp: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute:'2-digit' }) }
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
  res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
};

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getActivityFeed,
  getNotifications,
  markNotificationRead
};
