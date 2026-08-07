import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function WarehouseLogisticsPage({ inventory, orders, showToast }) {
  const [inventoryData, setInventoryData] = useState(
    (inventory || []).map(item => ({
      ...item,
      product_id: item.product_id || item.ProductID,
      product_name: item.product_name || item.ProductName || item.sku || item.SKU || `Sản phẩm #${item.product_id || item.ProductID}`,
      sku: item.sku || item.SKU || `SKU-${item.product_id || item.ProductID}`,
      stock_on_hand: item.stock_on_hand !== undefined ? item.stock_on_hand : (item.QuantityOnHand || 0),
      reserved: item.reserved !== undefined ? item.reserved : (item.ReservedQuantity || 0),
      min_stock_level: item.min_stock_level || 30,
      location: item.location || 'Kho A1 (Chính)'
    }))
  );

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchShipments();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await apiService.getInventory();
      if (res.success && res.inventory) {
        setInventoryData(res.inventory.map(item => ({
          ...item,
          product_id: item.product_id || item.ProductID,
          product_name: item.product_name || item.ProductName || item.sku || item.SKU || `Sản phẩm #${item.product_id || item.ProductID}`,
          sku: item.sku || item.SKU || `SKU-${item.product_id || item.ProductID}`,
          stock_on_hand: item.stock_on_hand !== undefined ? item.stock_on_hand : (item.QuantityOnHand || 0),
          reserved: item.reserved !== undefined ? item.reserved : (item.ReservedQuantity || 0),
          min_stock_level: item.min_stock_level || 30,
          location: item.location || 'Kho A1 (Chính)'
        })));
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await apiService.getShipments();
      if (res.success && res.data) {
        setShipments(res.data);
      }
    } catch (err) {
      if (showToast) showToast('Lỗi tải danh sách phiếu xuất kho');
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ product_id: '', adjustment_type: 'IMPORT', quantity: '', reason: '' });
  const [shipmentForm, setShipmentForm] = useState({ buyer_company: '', carrier: 'Giao Hàng Nhanh (GHN)', items_summary: '', estimated_delivery: '' });

  const totalStock = inventoryData.reduce((sum, i) => sum + Number(i.stock_on_hand || 0), 0);
  const totalReserved = inventoryData.reduce((sum, i) => sum + Number(i.reserved || 0), 0);
  const totalAvailable = inventoryData.reduce((sum, i) => sum + (Number(i.stock_on_hand || 0) - Number(i.reserved || 0)), 0);
  const lowStockCount = inventoryData.filter(i => (Number(i.stock_on_hand || 0) - Number(i.reserved || 0)) <= Number(i.min_stock_level || 30)).length;

  const filteredInventory = inventoryData.filter(item => {
    const skuStr = (item.sku || item.SKU || '').toLowerCase();
    const nameStr = (item.product_name || item.ProductName || '').toLowerCase();
    const searchStr = (searchTerm || '').toLowerCase();
    return skuStr.includes(searchStr) || nameStr.includes(searchStr);
  });

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    const pId = parseInt(adjustForm.product_id);
    const item = inventoryData.find(i => (i.product_id || i.ProductID) === pId);
    if (!item) { if (showToast) showToast('Vui lòng chọn sản phẩm hợp lệ!'); return; }
    const qty = parseInt(adjustForm.quantity);
    if (!qty || qty <= 0) { if (showToast) showToast('Số lượng phải lớn hơn 0'); return; }

    try {
      const res = await apiService.adjustStock({
        product_id: pId,
        adjustment_type: adjustForm.adjustment_type,
        quantity: qty,
        reason: adjustForm.reason
      });

      if (res.success) {
        if (showToast) showToast(res.message || `Đã ${adjustForm.adjustment_type === 'IMPORT' ? 'nhập' : 'xuất'} kho ${qty} thùng thành công!`);
        setShowAdjustModal(false);
        setAdjustForm({ product_id: '', adjustment_type: 'IMPORT', quantity: '', reason: '' });
        fetchInventory(); // Refresh from DB
      } else {
        if (showToast) showToast(res.message || 'Lỗi điều chỉnh tồn kho');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Lỗi khi cập nhật tồn kho');
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    if (!shipmentForm.buyer_company || !shipmentForm.items_summary) {
      if (showToast) showToast('Vui lòng điền đầy đủ thông tin khách hàng và hàng hóa!');
      return;
    }
    try {
      const res = await apiService.createShipment({
        buyer_company: shipmentForm.buyer_company,
        carrier: shipmentForm.carrier || 'Giao Hàng Nhanh (GHN)',
        items_summary: shipmentForm.items_summary,
        estimated_delivery: shipmentForm.estimated_delivery
      });

      if (res.success) {
        if (showToast) showToast(res.message || 'Đã tạo phiếu vận chuyển mới thành công!');
        setShowShipmentModal(false);
        setShipmentForm({ buyer_company: '', carrier: 'Giao Hàng Nhanh (GHN)', items_summary: '', estimated_delivery: '' });
        fetchShipments(); // Refresh from DB
      } else {
        if (showToast) showToast(res.message || 'Lỗi khi tạo vận đơn');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Lỗi khi tạo vận đơn');
    }
  };

  const updateShipmentStatus = async (shipmentId, newStatus) => {
    try {
      const res = await apiService.updateShipmentStatus(shipmentId, newStatus);
      if (res.success) {
        if (showToast) showToast(res.message || 'Đã cập nhật trạng thái vận đơn thành công!');
        fetchShipments(); // Refresh from DB
      } else {
        if (showToast) showToast(res.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (err) {
      if (showToast) showToast('Lỗi khi cập nhật trạng thái');
    }
  };

  const statusColors = {
    'PICKING': '#F59E0B',
    'PACKED': '#8B5CF6',
    'IN_TRANSIT': '#3B82F6',
    'DELIVERED': '#10B981',
    'RETURNED': '#EF4444'
  };

  const statusLabels = {
    'PICKING': 'Đang Lấy Hàng',
    'PACKED': 'Đã Đóng Gói',
    'IN_TRANSIT': 'Đang Vận Chuyển',
    'DELIVERED': 'Đã Giao Hàng',
    'RETURNED': 'Hoàn Trả'
  };

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {loading && <div style={{ color: '#FFF', padding: '10px' }}>Đang tải dữ liệu thực tế từ DB...</div>}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <i className="fa-solid fa-boxes-stacked gold-text"></i> Kho Hàng & Logistics
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Theo dõi tồn kho thực tế, xuất/nhập kho, tạo phiếu vận chuyển & biên bản giao nhận.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-redapron-gold" onClick={() => setShowAdjustModal(true)}>
            <i className="fa-solid fa-arrows-rotate"></i> Nhập/Xuất Kho
          </button>
          <button className="btn-redapron-burgundy" onClick={() => setShowShipmentModal(true)}>
            <i className="fa-solid fa-truck"></i> Tạo Phiếu Vận Chuyển
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng Tồn Kho</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-gold)', marginTop: '4px' }}>{totalStock.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>thùng</span></div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Đã Đặt Trước</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B', marginTop: '4px' }}>{totalReserved.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>thùng</span></div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Khả Dụng</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981', marginTop: '4px' }}>{totalAvailable.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>thùng</span></div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Cảnh Báo Thấp</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: lowStockCount > 0 ? '#EF4444' : '#10B981', marginTop: '4px' }}>
            {lowStockCount} <span style={{ fontSize: '0.8rem' }}>sản phẩm</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Đang Vận Chuyển</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3B82F6', marginTop: '4px' }}>
            {shipments.filter(s => s.shipment_status !== 'DELIVERED').length} <span style={{ fontSize: '0.8rem' }}>phiếu</span>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-gold)', marginBottom: '20px', gap: '5px' }}>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 20px', background: activeTab === 'inventory' ? 'var(--accent-burgundy)' : 'transparent',
            color: activeTab === 'inventory' ? '#FFF' : 'var(--text-muted)', border: 'none',
            borderTopLeftRadius: '6px', borderTopRightRadius: '6px', fontFamily: 'var(--font-brand)',
            fontSize: '0.8rem', letterSpacing: '1px', cursor: 'pointer'
          }}
        >
          <i className="fa-solid fa-warehouse" style={{ marginRight: '6px' }}></i> Tồn Kho
        </button>
        <button
          onClick={() => setActiveTab('shipments')}
          style={{
            padding: '10px 20px', background: activeTab === 'shipments' ? 'var(--accent-burgundy)' : 'transparent',
            color: activeTab === 'shipments' ? '#FFF' : 'var(--text-muted)', border: 'none',
            borderTopLeftRadius: '6px', borderTopRightRadius: '6px', fontFamily: 'var(--font-brand)',
            fontSize: '0.8rem', letterSpacing: '1px', cursor: 'pointer'
          }}
        >
          <i className="fa-solid fa-truck" style={{ marginRight: '6px' }}></i> Phiếu Vận Chuyển ({shipments.length})
        </button>
      </div>

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="card-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Bảng Tồn Kho Thực Tế</h4>
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm theo SKU hoặc tên sản phẩm..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ maxWidth: '350px' }}
            />
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ SKU</th>
                <th>TÊN SẢN PHẨM</th>
                <th>VỊ TRÍ KHO</th>
                <th>TỒN KHO</th>
                <th>ĐÃ GIỮ</th>
                <th>KHẢ DỤNG</th>
                <th>MỨC CẢNH BÁO</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(inv => {
                const pId = inv.product_id || inv.ProductID;
                const stockOnHand = inv.stock_on_hand !== undefined ? inv.stock_on_hand : (inv.QuantityOnHand || 0);
                const reservedStock = inv.reserved !== undefined ? inv.reserved : (inv.ReservedQuantity || 0);
                const available = stockOnHand - reservedStock;
                const minLevel = inv.min_stock_level || 30;
                const isLow = available <= minLevel;
                const stockPercent = minLevel > 0 ? Math.min(100, Math.round((available / (minLevel * 5)) * 100)) : 100;
                
                return (
                  <tr key={pId}>
                    <td><code style={{ color: 'var(--accent-gold)' }}>{inv.sku || inv.SKU}</code></td>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '250px' }}>{inv.product_name || inv.ProductName}</td>
                    <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.location || 'Kho A1 (Chính)'}</span></td>
                    <td><strong>{stockOnHand} thùng</strong></td>
                    <td style={{ color: '#F59E0B' }}>{reservedStock} thùng</td>
                    <td className="gold-text"><strong>{available} thùng</strong></td>
                    <td>{minLevel} thùng</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.1)' }}>
                          <div style={{ width: `${stockPercent}%`, height: '100%', borderRadius: '3px', background: isLow ? '#EF4444' : '#10B981' }}></div>
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: isLow ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                          color: isLow ? '#EF4444' : '#10B981'
                        }}>
                          {isLow ? '⚠ Thấp' : '✓ OK'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SHIPMENTS TAB */}
      {activeTab === 'shipments' && (
        <div className="card-box">
          <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '20px' }}>Theo Dõi Phiếu Vận Chuyển & Giao Nhận</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ VẬN CHUYỂN</th>
                <th>KHÁCH HÀNG</th>
                <th>NHÀ VẬN CHUYỂN</th>
                <th>HÀNG HÓA</th>
                <th>NGÀY DỰ KIẾN</th>
                <th>THỰC TẾ</th>
                <th>TRẠNG THÁI</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => {
                const sId = s.shipment_id || s.ShipmentID;
                const tracking = s.tracking_number || s.TrackingNumber || `GHN-${sId}-VN`;
                const company = s.buyer_company || s.BuyerCompany || 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON';
                const carrier = s.carrier || s.Carrier || 'Giao Hàng Nhanh (GHN)';
                const itemsSummary = s.items_summary || s.ItemsSummary || 'Rượu Vang & Whisky Sỉ';
                const estDate = s.estimated_delivery || (s.EstimatedDeliveryDate ? new Date(s.EstimatedDeliveryDate).toISOString().split('T')[0] : '2026-08-10');
                const actDate = s.actual_delivery || (s.ActualDeliveryDate ? new Date(s.ActualDeliveryDate).toISOString().split('T')[0] : '—');
                const st = s.shipment_status || s.ShipmentStatus || 'PICKING';

                return (
                  <tr key={sId}>
                    <td><code style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{tracking}</code></td>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '200px', fontSize: '0.8rem' }}>{company}</td>
                    <td style={{ fontSize: '0.8rem' }}>{carrier}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{itemsSummary}</td>
                    <td>{estDate}</td>
                    <td>{actDate}</td>
                    <td>
                      <span style={{
                        color: statusColors[st] || '#3B82F6',
                        background: `${statusColors[st] || '#3B82F6'}15`,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        border: `1px solid ${statusColors[st] || '#3B82F6'}40`
                      }}>
                        {statusLabels[st] || st}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        style={{ width: '150px', padding: '4px 8px', fontSize: '0.75rem' }}
                        value=""
                        onChange={(e) => { if (e.target.value) updateShipmentStatus(sId, e.target.value); }}
                      >
                        <option value="">Cập nhật...</option>
                        <option value="PICKING">→ Đang Lấy Hàng</option>
                        <option value="PACKED">→ Đã Đóng Gói</option>
                        <option value="IN_TRANSIT">→ Đang Vận Chuyển</option>
                        <option value="DELIVERED">→ Đã Giao Hàng</option>
                        <option value="RETURNED">→ Hoàn Trả</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADJUST STOCK */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Nhập/Xuất Kho Thực Tế</h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="form-group">
                <label>Sản Phẩm Cần Điều Chỉnh *</label>
                <select
                  className="form-control"
                  value={adjustForm.product_id}
                  onChange={e => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {inventoryData.map(inv => {
                    const pid = inv.product_id || inv.ProductID;
                    const sku = inv.sku || inv.SKU;
                    const pname = inv.product_name || inv.ProductName;
                    const stock = inv.stock_on_hand !== undefined ? inv.stock_on_hand : (inv.QuantityOnHand || 0);
                    return (
                      <option key={pid} value={pid}>
                        {sku} — {pname} (Tồn: {stock} thùng)
                      </option>
                    );
                  })}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Loại Điều Chỉnh</label>
                  <select className="form-control" value={adjustForm.adjustment_type} onChange={e => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}>
                    <option value="IMPORT">Nhập Kho (+)</option>
                    <option value="EXPORT">Xuất Kho (−)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Số Lượng (Thùng) *</label>
                  <input type="number" className="form-control" min="1" placeholder="50" value={adjustForm.quantity} onChange={e => setAdjustForm({ ...adjustForm, quantity: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Lý Do / Ghi Chú</label>
                <input type="text" className="form-control" placeholder="Nhập lô hàng mới từ nhà cung cấp..." value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn-redapron-burgundy" style={{ padding: '10px 20px' }}>HỦY</button>
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>XÁC NHẬN CẬP NHẬT DB</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SHIPMENT */}
      {showShipmentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '550px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Tạo Phiếu Vận Chuyển Mới</h3>
              <button onClick={() => setShowShipmentModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateShipment}>
              <div className="form-group">
                <label>Khách Hàng Nhận *</label>
                <input type="text" className="form-control" placeholder="CÔNG TY CP KHÁCH SẠN LOTTE SAIGON" value={shipmentForm.buyer_company} onChange={e => setShipmentForm({ ...shipmentForm, buyer_company: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Nhà Vận Chuyển</label>
                <select className="form-control" value={shipmentForm.carrier} onChange={e => setShipmentForm({ ...shipmentForm, carrier: e.target.value })}>
                  <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                  <option value="J&T Express">J&T Express</option>
                  <option value="Viettel Post">Viettel Post</option>
                  <option value="Tự vận chuyển">Tự vận chuyển</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mô Tả Hàng Hóa *</label>
                <input type="text" className="form-control" placeholder="Macallan 18 x 20 thùng, Dom Pérignon x 10 thùng..." value={shipmentForm.items_summary} onChange={e => setShipmentForm({ ...shipmentForm, items_summary: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Ngày Giao Dự Kiến</label>
                <input type="date" className="form-control" value={shipmentForm.estimated_delivery} onChange={e => setShipmentForm({ ...shipmentForm, estimated_delivery: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowShipmentModal(false)} className="btn-redapron-burgundy" style={{ padding: '10px 20px' }}>HỦY</button>
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>TẠO PHIẾU VÀO DB</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
