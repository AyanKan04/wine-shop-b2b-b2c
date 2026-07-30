const { getPool, sql } = require('../config/db');

// Get full inventory with computed available quantity
const getInventory = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT i.InventoryID, i.ProductID, i.QuantityOnHand, i.ReservedQuantity,
             p.ProductName, p.SKU, p.ImageUrl,
             (i.QuantityOnHand - i.ReservedQuantity) AS available,
             CASE WHEN (i.QuantityOnHand - i.ReservedQuantity) <= ISNULL(p.MOQ, 10) THEN 'LOW' ELSE 'OK' END AS stock_status
      FROM Inventories i
      JOIN Products p ON i.ProductID = p.ProductID
    `);

    const inventory = result.recordset.map(row => ({
      inventory_id: row.InventoryID,
      product_id: row.ProductID,
      product_name: row.ProductName,
      sku: row.SKU,
      image_url: row.ImageUrl,
      stock_on_hand: row.QuantityOnHand || 0,
      reserved: row.ReservedQuantity || 0,
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
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const invCheck = await transaction.request()
        .input('ProductID', sql.BigInt, productId)
        .query(`SELECT QuantityOnHand, ReservedQuantity FROM Inventories WHERE ProductID = @ProductID`);
      
      let currentStock = 0;
      let reserved = 0;

      if (invCheck.recordset.length === 0) {
        if (adjustment_type === 'EXPORT') {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Sản phẩm chưa có trong kho, không thể xuất.' });
        }
        await transaction.request()
          .input('ProductID', sql.BigInt, productId)
          .query(`INSERT INTO Inventories (ProductID, QuantityOnHand, ReservedQuantity) VALUES (@ProductID, 0, 0)`);
      } else {
        currentStock = invCheck.recordset[0].QuantityOnHand || 0;
        reserved = invCheck.recordset[0].ReservedQuantity || 0;
      }

      const available = currentStock - reserved;

      if (adjustment_type === 'IMPORT') {
        await transaction.request()
          .input('ProductID', sql.BigInt, productId)
          .input('Qty', sql.Int, qty)
          .query(`UPDATE Inventories SET QuantityOnHand = QuantityOnHand + @Qty WHERE ProductID = @ProductID`);
        
        await transaction.commit();
        return res.json({ success: true, message: `Đã nhập kho thêm ${qty} thùng.` });

      } else if (adjustment_type === 'EXPORT') {
        if (qty > available) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: `Không đủ hàng khả dụng. Chỉ còn ${available} thùng.` });
        }

        await transaction.request()
          .input('ProductID', sql.BigInt, productId)
          .input('Qty', sql.Int, qty)
          .query(`UPDATE Inventories SET QuantityOnHand = QuantityOnHand - @Qty WHERE ProductID = @ProductID`);
        
        await transaction.commit();
        return res.json({ success: true, message: `Đã xuất kho ${qty} thùng.` });
      } else {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'adjustment_type phải là IMPORT hoặc EXPORT' });
      }

    } catch (err) {
      await transaction.rollback();
      throw err;
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
    const result = await pool.request().query(`
      SELECT s.ShipmentID, s.TrackingNumber, s.ShipmentStatus, s.EstimatedDeliveryDate, 
             o.OrderNumber, bc.CompanyName as buyer_company
      FROM Shipments s
      LEFT JOIN Orders o ON s.OrderID = o.OrderID
      LEFT JOIN Companies bc ON o.BuyerCompanyID = bc.CompanyID
      ORDER BY s.EstimatedDeliveryDate DESC
    `);

    const shipments = result.recordset.map(row => ({
      shipment_id: row.ShipmentID,
      tracking_number: row.TrackingNumber,
      order_number: row.OrderNumber,
      buyer_company: row.buyer_company || 'Doanh nghiệp',
      carrier: 'Giao Hàng Nhanh (GHN)',
      shipment_status: row.ShipmentStatus,
      estimated_delivery: row.EstimatedDeliveryDate ? row.EstimatedDeliveryDate.toISOString().split('T')[0] : null
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
  const trackingNumber = `VN-SHIP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

  try {
    const pool = await getPool();
    
    let orderId = null;
    if (order_number) {
      const ordRes = await pool.request()
        .input('OrderNumber', sql.NVarChar, order_number)
        .query('SELECT OrderID FROM Orders WHERE OrderNumber = @OrderNumber');
      if (ordRes.recordset.length > 0) {
        orderId = ordRes.recordset[0].OrderID;
      }
    }

    const result = await pool.request()
      .input('OrderID', sql.BigInt, orderId)
      .input('TrackingNumber', sql.NVarChar, trackingNumber)
      .input('EstimatedDeliveryDate', sql.DateTime, estimated_delivery ? new Date(estimated_delivery) : null)
      .query(`
        INSERT INTO Shipments (OrderID, TrackingNumber, ShipmentStatus, EstimatedDeliveryDate)
        OUTPUT INSERTED.ShipmentID
        VALUES (@OrderID, @TrackingNumber, 'PICKING', @EstimatedDeliveryDate)
      `);

    const newShipment = {
      shipment_id: result.recordset[0].ShipmentID,
      tracking_number: trackingNumber,
      order_number: order_number,
      buyer_company: buyer_company || 'Doanh nghiệp',
      carrier: carrier || 'Giao Hàng Nhanh (GHN)',
      shipment_status: 'PICKING',
      estimated_delivery: estimated_delivery
    };

    res.status(201).json({ success: true, message: 'Đã tạo vận đơn thành công!', shipment: newShipment });
  } catch (err) {
    console.error('Error creating shipment:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo vận đơn' });
  }
};

// Update Shipment status
const updateShipmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const pool = await getPool();
    await pool.request()
      .input('ShipmentID', sql.BigInt, parseInt(id))
      .input('Status', sql.NVarChar, status)
      .query(`UPDATE Shipments SET ShipmentStatus = @Status WHERE ShipmentID = @ShipmentID`);

    res.json({
      success: true,
      message: `Cập nhật trạng thái vận chuyển: ${status}`
    });
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
