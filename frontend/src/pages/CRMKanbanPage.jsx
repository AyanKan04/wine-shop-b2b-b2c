import React, { useState } from 'react';

export default function CRMKanbanPage({ showToast }) {
  // Sample Initial B2B Kanban Deals State
  const [deals, setDeals] = useState([
    {
      id: 'DEAL-101',
      title: 'Hợp đồng Tết 2027 - Macallan 18',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      product_name: 'Macallan 18 Year Old Sherry Oak Single Malt',
      category: 'Spirits / Whisky',
      quantity: 150,
      unit_price: 68000000,
      total_value: 10200000000,
      status: 'in_negotiation', // new_rfq | in_negotiation | quotation_sent | closed_won | fulfillment_credit
      buyer_type: 'Hotel 5*',
      payment_method: 'Net-30 Credit',
      license_verified: true,
      last_updated: '10 phút trước'
    },
    {
      id: 'DEAL-102',
      title: 'Vang Đỏ Đêm Tiệc Gala - Chateau Margaux',
      buyer_company: 'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL',
      product_name: 'Château Margaux Premier Grand Cru Classé 2018',
      category: 'Fine Wine',
      quantity: 40,
      unit_price: 110000000,
      total_value: 4400000000,
      status: 'new_rfq',
      buyer_type: 'Hotel 4*',
      payment_method: 'Pre-payment',
      license_verified: false,
      last_updated: '1 giờ trước'
    },
    {
      id: 'DEAL-103',
      title: 'Đơn Hàng Sâm-Panh Sự Kiện - Dom Perignon',
      buyer_company: 'TẬP ĐOÀN DỊCH VỤ ẨM THỰC RED CHILI',
      product_name: 'Dom Pérignon Vintage Brut Champagne 2012',
      category: 'Champagne',
      quantity: 80,
      unit_price: 37500000,
      total_value: 3000000000,
      status: 'quotation_sent',
      buyer_type: 'Restaurant Chain',
      payment_method: 'Net-30 Credit',
      license_verified: true,
      last_updated: '3 giờ trước'
    },
    {
      id: 'DEAL-104',
      title: 'Cung Cấp Cognac - Hennessy X.O',
      buyer_company: 'CÔNG TY CP THƯƠNG MẠI AN PHÚ',
      product_name: 'Hennessy X.O Cognac Extra Old Edition',
      category: 'Cognac',
      quantity: 50,
      unit_price: 54000000,
      total_value: 2700000000,
      status: 'closed_won',
      buyer_type: 'Distributor',
      payment_method: 'Net-30 Credit',
      license_verified: true,
      last_updated: 'Hôm qua'
    },
    {
      id: 'DEAL-105',
      title: 'Giao Hàng Lô Vang Đỏ Margaux Đợt 1',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      product_name: 'Château Margaux Premier Grand Cru Classé 2018',
      category: 'Fine Wine',
      quantity: 20,
      unit_price: 110000000,
      total_value: 2200000000,
      status: 'fulfillment_credit',
      buyer_type: 'Hotel 5*',
      payment_method: 'Net-30 Credit',
      license_verified: true,
      last_updated: '2 ngày trước'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Deal Form State
  const [newDeal, setNewDeal] = useState({
    title: '',
    buyer_company: '',
    product_name: 'Macallan 18 Year Old Sherry Oak Single Malt',
    category: 'Spirits / Whisky',
    quantity: 50,
    unit_price: 68000000,
    buyer_type: 'Hotel 5*',
    payment_method: 'Net-30 Credit'
  });

  const columns = [
    { id: 'new_rfq', title: '📥 Tiếp Nhận RFQ', color: '#3B82F6' },
    { id: 'in_negotiation', title: '💬 Đang Đàm Phán', color: '#F59E0B' },
    { id: 'quotation_sent', title: '📄 Đã Gửi Báo Giá', color: '#8B5CF6' },
    { id: 'closed_won', title: '🤝 Đã Chốt Đơn (Won)', color: '#10B981' },
    { id: 'fulfillment_credit', title: '🚚 Vận Chuyển & Nợ', color: '#EC4899' }
  ];

  // Move deal to next or previous column
  const moveDeal = (dealId, direction) => {
    const columnOrder = ['new_rfq', 'in_negotiation', 'quotation_sent', 'closed_won', 'fulfillment_credit'];
    setDeals(prevDeals => prevDeals.map(deal => {
      if (deal.id === dealId) {
        const currentIndex = columnOrder.indexOf(deal.status);
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= 0 && newIndex < columnOrder.length) {
          const nextStatus = columnOrder[newIndex];
          showToast(`Đã chuyển cơ hội ${deal.id} sang trạng thái: ${columns.find(c => c.id === nextStatus).title}`);
          return { ...deal, status: nextStatus, last_updated: 'Vừa xong' };
        }
      }
      return deal;
    }));
  };

  // Add new deal
  const handleCreateDeal = (e) => {
    e.preventDefault();
    const qty = parseInt(newDeal.quantity) || 1;
    const price = parseFloat(newDeal.unit_price) || 0;
    const created = {
      id: `DEAL-${Math.floor(100 + Math.random() * 900)}`,
      title: newDeal.title || `Cơ hội B2B ${newDeal.product_name}`,
      buyer_company: newDeal.buyer_company || 'Doanh Nghiệp Mới',
      product_name: newDeal.product_name,
      category: newDeal.category,
      quantity: qty,
      unit_price: price,
      total_value: qty * price,
      status: 'new_rfq',
      buyer_type: newDeal.buyer_type,
      payment_method: newDeal.payment_method,
      license_verified: true,
      last_updated: 'Vừa xong'
    };

    setDeals([created, ...deals]);
    setShowAddModal(false);
    showToast(`Đã thêm cơ hội B2B mới ${created.id} vào CRM Kanban!`);
  };

  // Calculate Metrics
  const filteredDeals = deals.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.buyer_company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPipelineValue = filteredDeals.reduce((sum, d) => sum + d.total_value, 0);
  const closedWonValue = filteredDeals.filter(d => d.status === 'closed_won' || d.status === 'fulfillment_credit').reduce((sum, d) => sum + d.total_value, 0);
  const conversionRate = deals.length > 0 ? Math.round(((deals.filter(d => d.status === 'closed_won' || d.status === 'fulfillment_credit').length) / deals.length) * 100) : 0;

  const formatVND = (val) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ ₫';
    if (val >= 1000000) return (val / 1000000).toFixed(0) + ' Tr ₫';
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <i className="fa-solid fa-square-kanban gold-text"></i> Dashboard CRM Kanban B2B
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Quản lý đàm phán RFQ, Báo giá, Chốt đơn hàng & Theo dõi Hạn mức Tín dụng Net-30 theo thời gian thực.
          </p>
        </div>

        <button className="btn-redapron-gold" onClick={() => setShowAddModal(true)}>
          <i className="fa-solid fa-plus"></i> THÊM CƠ HỘI B2B MÓI
        </button>
      </div>

      {/* METRICS SUMMARY BAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '6px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng Giá Trị Pipeline</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-gold)', marginTop: '4px' }}>{formatVND(totalPipelineValue)}</div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px' }}><i className="fa-solid fa-chart-line"></i> {filteredDeals.length} Cơ hội giao dịch</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '6px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Đã Chốt & Giao Hàng</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#10B981', marginTop: '4px' }}>{formatVND(closedWonValue)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Đã chuyển thành Đơn hàng</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '6px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tỷ Lệ Chốt Đơn (Conversion)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#F59E0B', marginTop: '4px' }}>{conversionRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Tăng +12% so với tháng trước</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '6px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tuân Thủ Pháp Lý Giấy Phép</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#3B82F6', marginTop: '4px' }}>100% Verified</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Nghị định 105/2017/NĐ-CP</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '15px 20px', marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Tìm kiếm theo tên hợp đồng, khách sạn, nhà hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Danh mục rượu:</span>
          <select
            className="form-control"
            style={{ width: '180px' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">Tất Cả Danh Mục</option>
            <option value="Spirits / Whisky">Spirits / Whisky</option>
            <option value="Fine Wine">Fine Wine</option>
            <option value="Champagne">Champagne</option>
            <option value="Cognac">Cognac</option>
          </select>
        </div>
      </div>

      {/* KANBAN BOARD BOARD GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '20px'
      }}>
        {columns.map(col => {
          const colDeals = filteredDeals.filter(d => d.status === col.id);
          const colTotal = colDeals.reduce((sum, d) => sum + d.total_value, 0);

          return (
            <div key={col.id} style={{
              background: '#0F0B0D',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '600px'
            }}>
              {/* COLUMN HEADER */}
              <div style={{ borderBottom: `2px solid ${col.color}`, paddingBottom: '12px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#FFF', fontFamily: 'var(--font-brand)', margin: 0 }}>
                    {col.title}
                  </h4>
                  <span style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: col.color,
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {colDeals.length}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginTop: '4px', fontWeight: '600' }}>
                  {formatVND(colTotal)}
                </div>
              </div>

              {/* DEAL CARDS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {colDeals.length === 0 ? (
                  <div style={{ border: '1px dashed var(--border-subtle)', borderRadius: '6px', padding: '30px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Chưa có cơ hội trong bước này
                  </div>
                ) : (
                  colDeals.map(deal => (
                    <div key={deal.id} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '6px',
                      padding: '14px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-brand)', background: 'rgba(212,175,55,0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                          {deal.id}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {deal.last_updated}
                        </span>
                      </div>

                      <h5 style={{ fontSize: '0.85rem', color: '#FFF', margin: 0, lineHeight: '1.3' }}>
                        {deal.title}
                      </h5>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-building gold-text"></i> {deal.buyer_company}
                      </div>

                      <div style={{ background: '#090708', borderRadius: '4px', padding: '8px', fontSize: '0.75rem', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: '#FFF', fontWeight: '600' }}>{deal.product_name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <span>SL: <strong>{deal.quantity} chai/thùng</strong></span>
                          <span>Đơn giá: {formatVND(deal.unit_price)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tổng Giá Trị</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                            {formatVND(deal.total_value)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => moveDeal(deal.id, 'prev')}
                            title="Lùi trạng thái"
                            disabled={deal.status === 'new_rfq'}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border-subtle)',
                              color: deal.status === 'new_rfq' ? '#444' : '#FFF',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: deal.status === 'new_rfq' ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-chevron-left"></i>
                          </button>

                          <button
                            onClick={() => moveDeal(deal.id, 'next')}
                            title="Tới trạng thái tiếp theo"
                            disabled={deal.status === 'fulfillment_credit'}
                            style={{
                              background: 'rgba(212,175,55,0.2)',
                              border: '1px solid var(--accent-gold)',
                              color: 'var(--accent-gold)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: deal.status === 'fulfillment_credit' ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ADD NEW DEAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Thêm Cơ Hội Đàm Phán B2B Mới</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateDeal}>
              <div className="form-group">
                <label>Tên Hợp Đồng / Tiêu Đề RFQ *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Đơn cung cấp rượu sự kiện Hè 2027..."
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tên Công Ty Khách Hàng (Buyer) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="CÔNG TY CP KHÁCH SẠN LOTTE SAIGON..."
                  value={newDeal.buyer_company}
                  onChange={(e) => setNewDeal({ ...newDeal, buyer_company: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Sản Phẩm Rượu</label>
                  <select
                    className="form-control"
                    value={newDeal.product_name}
                    onChange={(e) => setNewDeal({ ...newDeal, product_name: e.target.value })}
                  >
                    <option value="Macallan 18 Year Old Sherry Oak Single Malt">Macallan 18 Year Old Sherry Oak</option>
                    <option value="Château Margaux Premier Grand Cru Classé 2018">Château Margaux Premier Grand Cru 2018</option>
                    <option value="Dom Pérignon Vintage Brut Champagne 2012">Dom Pérignon Vintage Brut 2012</option>
                    <option value="Hennessy X.O Cognac Extra Old Edition">Hennessy X.O Cognac Extra Old</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Số Lượng (Chai/Thùng)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newDeal.quantity}
                    onChange={(e) => setNewDeal({ ...newDeal, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Đơn Giá Đề Xuất (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newDeal.unit_price}
                    onChange={(e) => setNewDeal({ ...newDeal, unit_price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phương Thức Thanh Toán</label>
                  <select
                    className="form-control"
                    value={newDeal.payment_method}
                    onChange={(e) => setNewDeal({ ...newDeal, payment_method: e.target.value })}
                  >
                    <option value="Net-30 Credit">Net-30 Credit (Nợ 30 ngày)</option>
                    <option value="Pre-payment">Pre-payment (Chuyển khoản trước)</option>
                    <option value="LC Credit">L/C Thư Tín Dụng</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-redapron-burgundy" style={{ padding: '10px 20px' }}>HỦY</button>
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>TẠO CƠ HỘI KANBAN</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
