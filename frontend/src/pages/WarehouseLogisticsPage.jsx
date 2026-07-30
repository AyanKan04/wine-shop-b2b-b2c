import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function WarehouseLogisticsPage({ inventory, orders, showToast }) {
  const [inventoryData, setInventoryData] = useState(
    (inventory || []).map(item => ({
      ...item,
      product_name: item.product_name || item.sku,
      min_stock_level: item.min_stock_level || 30,
      location: item.location || 'Kho A1'
    }))
  );

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await apiService.getShipments();
      if (res.success && res.data) {
        setShipments(res.data);
      }
    } catch (err) {
      showToast('Lỗi tải danh sách phiếu xuất kho');
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

  const formatVND = (val) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ ₫';
    if (val >= 1000000) return (val / 1000000).toFixed(0) + ' Tr ₫';
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  const totalStock = inventoryData.reduce((sum, i) => sum + i.stock_on_hand, 0);
  const totalReserved = inventoryData.reduce((sum, i) => sum + i.reserved, 0);
  const totalAvailable = inventoryData.reduce((sum, i) => sum + (i.stock_on_hand - i.reserved), 0);
  const lowStockCount = inventoryData.filter(i => (i.stock_on_hand - i.reserved) <= i.min_stock_level).length;

  const filteredInventory = inventoryData.filter(item =>
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.product_name && item.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdjustStock = (e) => {
    e.preventDefault();
    const item = inventoryData.find(i => i.product_id === parseInt(adjustForm.product_id));
    if (!item) { showToast('Vui lòng chọn sản phẩm!'); return; }
    const qty = parseInt(adjustForm.quantity);
    if (!qty || qty <= 0) { showToast('Số lượng phải lớn hơn 0'); return; }

    setInventoryData(prev => prev.map(inv => {
      if (inv.product_id === parseInt(adjustForm.product_id)) {
        if (adjustForm.adjustment_type === 'IMPORT') {
          return { ...inv, stock_on_hand: inv.stock_on_hand + qty };
        } else {
          if (qty > (inv.stock_on_hand - inv.reserved)) {
            showToast(`Không đủ hàng khả dụng! Chỉ còn ${inv.stock_on_hand - inv.reserved} thùng.`);
            return inv;
          }
          return { ...inv, stock_on_hand: inv.stock_on_hand - qty };
        }
      }
      return inv;
    }));

    showToast(`Đã ${adjustForm.adjustment_type === 'IMPORT' ? 'nhập' : 'xuất'} kho ${qty} thùng ${item.sku} thành công!`);
    setShowAdjustModal(false);
    setAdjustForm({ product_id: '', adjustment_type: 'IMPORT', quantity: '', reason: '' });
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      await apiService.createShipment({
        order_id: null,
        carrier: shipmentForm.carrier,
        estimated_delivery_date: shipmentForm.estimated_delivery
      });
      showToast(`Đã tạo phiếu xuất kho!`);
      setShowShipmentModal(false);
      setShipmentForm({ buyer_company: '', carrier: 'Giao Hàng Nhanh (GHN)', items_summary: '', estimated_delivery: '' });
      fetchShipments();
    } catch (err) {
      showToast('Lỗi khi tạo vận đơn');
    }
  };

  const updateShipmentStatus = async (shipmentId, newStatus) => {
    try {
      await apiService.updateShipmentStatus(shipmentId, newStatus);
      showToast(`Đã cập nhật trạng thái vận đơn thành công`);
      fetchShipments();
    } catch (err) {
      showToast('Lỗi khi cập nhật trạng thái');
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
      
      {loading && <div style={{ color: '#FFF', padding: '10px' }}>Đang tải dữ liệu...</div>}

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
          <i className="fa-solid fa-truck" style={{ marginRight: '6px' }}></i> Phiếu Vận Chuyển
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
                const available = inv.stock_on_hand - inv.reserved;
                const isLow = available <= inv.min_stock_level;
                const stockPercent = inv.min_stock_level > 0 ? Math.min(100, Math.round((available / (inv.min_stock_level * 5)) * 100)) : 100;
                return (
                  <tr key={inv.product_id}>
                    <td><code style={{ color: 'var(--accent-gold)' }}>{inv.sku}</code></td>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '250px' }}>{inv.product_name}</td>
                    <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.location}</span></td>
                    <td>{inv.stock_on_hand} thùng</td>
                    <td style={{ color: '#F59E0B' }}>{inv.reserved} thùng</td>
                    <td className="gold-text"><strong>{available} thùng</strong></td>
                    <td>{inv.min_stock_level} thùng</td>
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
              {shipments.map(s => (
                <tr key={s.shipment_id}>
                  <td><code style={{ color: 'var(--accent-gold)' }}>{s.tracking_number || 'Chưa cấp'}</code></td>
                  <td style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '200px', fontSize: '0.8rem' }}>{s.buyer_company}</td>
                  <td style={{ fontSize: '0.8rem' }}>{s.carrier || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.items_summary}</td>
                  <td>{s.estimated_delivery || '—'}</td>
                  <td>{s.actual_delivery || '—'}</td>
                  <td>
                    <span style={{
                      color: statusColors[s.shipment_status] || '#FFF',
                      background: `${statusColors[s.shipment_status]}15`,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      border: `1px solid ${statusColors[s.shipment_status]}40`
                    }}>
                      {statusLabels[s.shipment_status] || s.shipment_status}
                    </span>
                  </td>
                  <td>
                    {s.shipment_status !== 'DELIVERED' && (
                      <select
                        className="form-control"
                        style={{ width: '140px', padding: '4px 8px', fontSize: '0.75rem' }}
                        value=""
                        onChange={(e) => { if (e.target.value) updateShipmentStatus(s.shipment_id, e.target.value); }}
                      >
                        <option value="">Cập nhật...</option>
                        {s.shipment_status === 'PICKING' && <option value="PACKED">→ Đã Đóng Gói</option>}
                        {(s.shipment_status === 'PICKING' || s.shipment_status === 'PACKED') && <option value="IN_TRANSIT">→ Đang Vận Chuyển</option>}
                        {s.shipment_status === 'IN_TRANSIT' && <option value="DELIVERED">→ Đã Giao Hàng</option>}
                        <option value="RETURNED">→ Hoàn Trả</option>
                      </select>
                    )}
                    {s.shipment_status === 'DELIVERED' && (
                      <span style={{ fontSize: '0.75rem', color: '#10B981' }}>✓ Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADJUST STOCK */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Nhập/Xuất Kho</h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="form-group">
                <label>Sản Phẩm *</label>
                <select className="form-control" value={adjustForm.product_id} onChange={e => setAdjustForm({ ...adjustForm, product_id: e.target.value })} required>
                  <option value="">-- Chọn sản phẩm --</option>
                  {inventoryData.map(inv => (
                    <option key={inv.product_id} value={inv.product_id}>{inv.sku} — {inv.product_name} (Tồn: {inv.stock_on_hand})</option>
                  ))}
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
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>XÁC NHẬN</button>
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
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Tạo Phiếu Vận Chuyển</h3>
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
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>TẠO PHIẾU</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
