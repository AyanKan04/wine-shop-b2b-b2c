const { dbMock } = require('../config/db');

// Get full inventory with computed available quantity
const getInventory = (req, res) => {
  const inventory = dbMock.inventory.map(item => ({
    ...item,
    available: item.stock_on_hand - item.reserved,
    stock_status: (item.stock_on_hand - item.reserved) <= item.min_stock_level ? 'LOW' : 'OK'
  }));
  res.json({ success: true, inventory });
};

// Adjust stock (import/export)
const adjustStock = (req, res) => {
  const { product_id, adjustment_type, quantity, reason } = req.body;
  const item = dbMock.inventory.find(i => i.product_id === parseInt(product_id));
  
  if (!item) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong kho' });
  }

  const qty = parseInt(quantity);
  if (!qty || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0' });
  }

  if (adjustment_type === 'IMPORT') {
    item.stock_on_hand += qty;
    // Log activity
    dbMock.activity_logs.unshift({
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      module: 'Warehouse',
      action: `Nhập kho ${qty} thùng ${item.product_name || item.sku}`,
      actor: 'Warehouse Staff',
      icon: 'fa-truck-ramp-box',
      color: '#3B82F6'
    });
    return res.json({ success: true, message: `Đã nhập kho thêm ${qty} thùng cho ${item.sku}. Tồn kho mới: ${item.stock_on_hand}`, inventory_item: item });
  } else if (adjustment_type === 'EXPORT') {
    if (qty > (item.stock_on_hand - item.reserved)) {
      return res.status(400).json({ success: false, message: `Không đủ hàng khả dụng. Chỉ còn ${item.stock_on_hand - item.reserved} thùng.` });
    }
    item.stock_on_hand -= qty;
    dbMock.activity_logs.unshift({
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      module: 'Warehouse',
      action: `Xuất kho ${qty} thùng ${item.product_name || item.sku}. Lý do: ${reason || 'Xuất hàng'}`,
      actor: 'Warehouse Staff',
      icon: 'fa-boxes-stacked',
      color: '#3B82F6'
    });
    return res.json({ success: true, message: `Đã xuất kho ${qty} thùng cho ${item.sku}. Tồn kho mới: ${item.stock_on_hand}`, inventory_item: item });
  }

  res.status(400).json({ success: false, message: 'adjustment_type phải là IMPORT hoặc EXPORT' });
};

// Get all shipments
const getShipments = (req, res) => {
  res.json({ success: true, data: dbMock.shipments });
};

// Create new shipment
const createShipment = (req, res) => {
  const { order_number, buyer_company, carrier, items_summary, estimated_delivery } = req.body;
  const newShipment = {
    shipment_id: dbMock.shipments.length + 1,
    order_id: null,
    order_number: order_number || null,
    buyer_company: buyer_company || 'Doanh nghiệp',
    tracking_number: `VN-SHIP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(dbMock.shipments.length + 1).padStart(3, '0')}`,
    carrier: carrier || 'Giao Hàng Nhanh (GHN)',
    shipment_status: 'PICKING',
    items_summary: items_summary || '',
    pickup_date: null,
    estimated_delivery: estimated_delivery || null,
    actual_delivery: null,
    delivery_note_url: null,
    created_at: new Date().toISOString().split('T')[0]
  };
  dbMock.shipments.push(newShipment);

  dbMock.activity_logs.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    module: 'Warehouse',
    action: `Tạo phiếu xuất kho mới: ${newShipment.tracking_number}`,
    actor: 'Warehouse Staff',
    icon: 'fa-truck',
    color: '#3B82F6'
  });

  res.json({ success: true, message: 'Đã tạo phiếu xuất kho/vận chuyển mới!', shipment: newShipment });
};

// Update shipment status
const updateShipmentStatus = (req, res) => {
  const shipment = dbMock.shipments.find(s => s.shipment_id === parseInt(req.params.id));
  if (!shipment) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu vận chuyển' });
  }

  const { status } = req.body;
  const validStatuses = ['PICKING', 'PACKED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Trạng thái phải là: ${validStatuses.join(', ')}` });
  }

  shipment.shipment_status = status;
  if (status === 'IN_TRANSIT') {
    shipment.pickup_date = new Date().toISOString().split('T')[0];
  }
  if (status === 'DELIVERED') {
    shipment.actual_delivery = new Date().toISOString().split('T')[0];
  }

  res.json({ success: true, message: `Đã cập nhật trạng thái vận chuyển thành: ${status}`, shipment });
};

module.exports = {
  getInventory,
  adjustStock,
  getShipments,
  createShipment,
  updateShipmentStatus
};
