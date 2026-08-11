const { getPool } = require('../config/db');

// Get full inventory with computed available quantity
const getInventory = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT i.inventory_id, i.product_id, i.quantity_on_hand, i.reserved_quantity,
             p.product_name, p.sku, p.image_url,
             (i.quantity_on_hand - i.reserved_quantity) AS available,
             CASE WHEN (i.quantity_on_hand - i.reserved_quantity) <= COALESCE(p.moq, 10) THEN 'LOW' ELSE 'OK' END AS stock_status
      FROM inventories i
      JOIN products p ON i.product_id = p.product_id
    `);

    const inventory = result.rows.map(row => ({
      inventory_id: row.inventory_id,
      product_id: row.product_id,
      product_name: row.product_name,
      sku: row.sku,
      image_url: row.image_url,
      stock_on_hand: row.quantity_on_hand || 0,
      reserved: row.reserved_quantity || 0,
      available: row.available || 0,
      stock_status: row.stock_status,
      min_stock_level: 10
    }));

    res.json({ success: true, inventory });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách tồn kho' });
  }
};

// Adjust stock (import/export)
const adjustStock = async (req, res) => {
  const { product_id, reason } = req.body;
  let { adjustment_type, quantity, quantity_change } = req.body;
  
  if (quantity_change !== undefined) {
    quantity = Math.abs(quantity_change);
    adjustment_type = quantity_change >= 0 ? 'IMPORT' : 'EXPORT';
  }

  const productId = parseInt(product_id);
  const qty = parseInt(quantity);
  
  if (!qty || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0' });
  }

  try {
    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const invCheck = await client.query(`SELECT quantity_on_hand, reserved_quantity FROM inventories WHERE product_id = $1`, [productId]);
      
      let currentStock = 0;
      let reserved = 0;

      if (invCheck.rows.length === 0) {
        if (adjustment_type === 'EXPORT') {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: 'Sản phẩm chưa có trong kho, không thể xuất.' });
        }
        await client.query(`INSERT INTO inventories (product_id, quantity_on_hand, reserved_quantity) VALUES ($1, 0, 0)`, [productId]);
      } else {
        currentStock = invCheck.rows[0].quantity_on_hand || 0;
        reserved = invCheck.rows[0].reserved_quantity || 0;
      }

      const available = currentStock - reserved;

      if (adjustment_type === 'IMPORT') {
        await client.query(`UPDATE inventories SET quantity_on_hand = quantity_on_hand + $1 WHERE product_id = $2`, [qty, productId]);
        
        await client.query('COMMIT');
        return res.json({ success: true, message: `Đã nhập kho thêm ${qty} thùng.` });

      } else if (adjustment_type === 'EXPORT') {
        if (qty > available) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: `Không đủ hàng khả dụng. Chỉ còn ${available} thùng.` });
        }

        await client.query(`UPDATE inventories SET quantity_on_hand = quantity_on_hand - $1 WHERE product_id = $2`, [qty, productId]);
        
        await client.query('COMMIT');
        return res.json({ success: true, message: `Đã xuất kho ${qty} thùng.` });
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'adjustment_type phải là IMPORT hoặc EXPORT' });
      }

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error adjusting stock:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi điều chỉnh tồn kho' });
  }
};

// Get all shipments
const getShipments = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT s.shipment_id, s.tracking_number, s.shipment_status, s.estimated_delivery_date, 
             o.order_number, bc.company_name as buyer_company, s.carrier, s.items_summary
      FROM shipments s
      LEFT JOIN orders o ON s.order_id = o.order_id
      LEFT JOIN companies bc ON o.buyer_company_id = bc.company_id
      ORDER BY s.estimated_delivery_date DESC
    `);

    const shipments = result.rows.map(row => ({
      shipment_id: row.shipment_id,
      tracking_number: row.tracking_number || `GHN-${row.shipment_id || Math.floor(Math.random()*1000)}-VN`,
      order_number: row.order_number || `ORD-2026-${row.shipment_id || 8842}`,
      buyer_company: row.buyer_company || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      carrier: row.carrier || 'Giao Hàng Nhanh (GHN)',
      items_summary: row.items_summary || 'Rượu Vang & Whisky Sỉ',
      shipment_status: row.shipment_status || 'PICKING',
      estimated_delivery: row.estimated_delivery_date ? (typeof row.estimated_delivery_date === 'string' ? row.estimated_delivery_date : row.estimated_delivery_date.toISOString().split('T')[0]) : '2026-08-10'
    }));

    res.json({ success: true, data: shipments });
  } catch (err) {
    console.error('Error fetching shipments:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách vận chuyển' });
  }
};

// Create new shipment
const createShipment = async (req, res) => {
  const { order_number, buyer_company, carrier, items_summary, estimated_delivery } = req.body;
  const trackingNumber = `GHN-${Date.now().toString().slice(-6)}-VN`;

  try {
    const pool = await getPool();
    
    let orderId = null;
    if (order_number) {
      const ordRes = await pool.query('SELECT order_id FROM orders WHERE order_number = $1', [order_number]);
      if (ordRes.rows.length > 0) {
        orderId = ordRes.rows[0].order_id;
      }
    }

    const result = await pool.query(`
        INSERT INTO shipments (order_id, tracking_number, shipment_status, estimated_delivery_date, buyer_company, carrier, items_summary)
        VALUES ($1, $2, 'PICKING', $3, $4, $5, $6)
        RETURNING shipment_id
      `, [orderId, trackingNumber, estimated_delivery ? new Date(estimated_delivery) : null, buyer_company || 'Doanh nghiệp', carrier || 'Giao Hàng Nhanh (GHN)', items_summary || 'Rượu nhập khẩu']);

    const newShipment = {
      shipment_id: result.rows[0].shipment_id,
      tracking_number: trackingNumber,
      order_number: order_number,
      buyer_company: buyer_company || 'Doanh nghiệp',
      carrier: carrier || 'Giao Hàng Nhanh (GHN)',
      items_summary: items_summary || 'Rượu nhập khẩu',
      shipment_status: 'PICKING',
      estimated_delivery: estimated_delivery
    };

    res.status(201).json({ success: true, message: 'Đã tạo phiếu vận chuyển thành công!', shipment: newShipment });
  } catch (err) {
    console.error('Error creating shipment:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo vận đơn.' });
  }
};

// Update Shipment status
const updateShipmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'PICKING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  const shipmentId = parseInt(id);

  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Fetch current shipment details
      const shipCheck = await client.query('SELECT order_id, shipment_status FROM shipments WHERE shipment_id = $1', [shipmentId]);

      if (shipCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Không tìm thấy vận đơn' });
      }

      const shipment = shipCheck.rows[0];
      if (shipment.shipment_status === status) {
        await client.query('ROLLBACK');
        return res.json({ success: true, message: `Vận đơn đã ở trạng thái ${status} từ trước.` });
      }

      // 2. Update Shipment status
      await client.query('UPDATE shipments SET shipment_status = $1 WHERE shipment_id = $2', [status, shipmentId]);

      // 3. If transitioning to DELIVERED or CANCELLED
      if (status === 'DELIVERED' || status === 'CANCELLED') {
        const orderId = shipment.order_id;
        if (orderId) {
          // Fetch order items
          const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);

          // Update stock for each item
          for (let item of itemsRes.rows) {
            if (status === 'DELIVERED') {
              // Deduct stock
              await client.query(`
                  UPDATE inventories 
                  SET quantity_on_hand = quantity_on_hand - $1,
                      reserved_quantity = reserved_quantity - $1
                  WHERE product_id = $2
                `, [item.quantity, item.product_id]);
            } else if (status === 'CANCELLED') {
              // Restore reserved stock
              await client.query(`
                  UPDATE inventories 
                  SET reserved_quantity = reserved_quantity - $1
                  WHERE product_id = $2
                `, [item.quantity, item.product_id]);
            }
          }

          // Complete or Cancel the order
          await client.query(`UPDATE orders SET order_status = $1 WHERE order_id = $2`, [status === 'DELIVERED' ? 'COMPLETED' : 'CANCELLED', orderId]);
        }
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        message: `Cập nhật trạng thái vận chuyển: ${status}`,
        shipment: {
          shipment_id: shipmentId,
          shipment_status: status
        }
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating shipment status:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái vận đơn' });
  }
};

module.exports = {
  getInventory,
  adjustStock,
  getShipments,
  createShipment,
  updateShipmentStatus
};
