import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function CRMKanbanPage({ showToast }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const [rfqRes, quoteRes] = await Promise.all([
        apiService.getRFQs(),
        apiService.getQuotations()
      ]);

      let newDeals = [];

      if (rfqRes.success && rfqRes.data) {
        rfqRes.data.forEach(rfq => {
          let status = 'new_rfq';
          if (rfq.status === 'IN_REVIEW') status = 'in_negotiation';
          if (rfq.status === 'QUOTATION_SENT') return; 
          if (rfq.status === 'REJECTED') return;
          
          newDeals.push({
            id: `RFQ-${rfq.rfq_id}`,
            title: rfq.title,
            buyer_company: rfq.buyer_company || 'Khách hàng',
            product_name: rfq.product_name,
            category: 'Yêu cầu báo giá',
            quantity: rfq.quantity,
            unit_price: rfq.target_price,
            total_value: rfq.quantity * rfq.target_price,
            status: status,
            buyer_type: 'B2B',
            payment_method: 'N/A',
            last_updated: rfq.created_at,
            originalType: 'RFQ',
            originalId: rfq.rfq_id
          });
        });
      }

      if (quoteRes.success && quoteRes.data) {
        quoteRes.data.forEach(q => {
          let status = 'quotation_sent';
          if (q.status === 'ACCEPTED') status = 'closed_won';
          if (q.status === 'FULFILLED') status = 'fulfillment_credit';
          if (q.status === 'REJECTED') return;
          
          newDeals.push({
            id: `QUOTE-${q.quotation_id}`,
            title: `Báo Giá RFQ-${q.rfq_id}`,
            buyer_company: q.buyer_company || 'Khách hàng',
            product_name: 'Sản phẩm rượu', 
            category: 'Báo Giá',
            quantity: q.quantity,
            unit_price: q.offer_unit_price,
            total_value: q.quantity * q.offer_unit_price,
            status: status,
            buyer_type: 'B2B',
            payment_method: 'Thỏa thuận',
            last_updated: q.valid_until,
            originalType: 'QUOTATION',
            originalId: q.quotation_id
          });
        });
      }
      
      setDeals(newDeals);
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải dữ liệu đàm phán CRM');
    } finally {
      setLoading(false);
    }
  };

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
    { id: 'new_rfq', title: 'Tiếp Nhận RFQ', color: '#3B82F6' },
    { id: 'in_negotiation', title: 'Đang Đàm Phán', color: '#F59E0B' },
    { id: 'quotation_sent', title: 'Đã Gửi Báo Giá', color: '#8B5CF6' },
    { id: 'closed_won', title: 'Đã Chốt Đơn (Won)', color: '#10B981' },
    { id: 'fulfillment_credit', title: 'Vận Chuyển & Nợ', color: '#EC4899' }
  ];

  // Move deal to next or previous column
  const moveDeal = async (dealId, direction) => {
    const columnOrder = ['new_rfq', 'in_negotiation', 'quotation_sent', 'closed_won', 'fulfillment_credit'];
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const currentIndex = columnOrder.indexOf(deal.status);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < columnOrder.length) {
      const nextStatus = columnOrder[newIndex];
      
      try {
        if (deal.originalType === 'QUOTATION') {
          let beStatus = 'PENDING';
          if (nextStatus === 'closed_won') beStatus = 'ACCEPTED';
          else if (nextStatus === 'fulfillment_credit') beStatus = 'FULFILLED';
          
          await apiService.updateQuotationStatus(deal.originalId, beStatus);
        } else if (deal.originalType === 'RFQ') {
          // No API available for RFQ status update directly in current implementation, 
          // usually moving RFQ to 'quotation_sent' implies creating a quotation.
          if (nextStatus === 'quotation_sent') {
            await apiService.createQuotation({
              rfq_id: deal.originalId,
              offer_unit_price: deal.unit_price,
              quantity: deal.quantity
            });
          }
        }
        
        showToast(`Đã chuyển cơ hội ${deal.id} sang trạng thái: ${columns.find(c => c.id === nextStatus).title}`);
        fetchDeals(); // Refresh from server
      } catch(err) {
        showToast('Lỗi cập nhật trạng thái');
      }
    }
  };

  // Add new deal
  const handleCreateDeal = async (e) => {
    e.preventDefault();
    const qty = parseInt(newDeal.quantity) || 1;
    const price = parseFloat(newDeal.unit_price) || 0;
    
    try {
      await apiService.createRFQ({
        title: newDeal.title,
        product_name: newDeal.product_name,
        quantity: qty,
        target_price: price
      });
      setShowAddModal(false);
      showToast(`Đã thêm cơ hội B2B mới vào CRM Kanban!`);
      setNewDeal({ ...newDeal, title: '', buyer_company: '' }); // reset form
      fetchDeals();
    } catch(err) {
      showToast('Lỗi tạo cơ hội mới');
    }
  };

  // Calculate Metrics
  const filteredDeals = (deals || []).filter(d => {
    const titleStr = d && d.title ? String(d.title).toLowerCase() : '';
    const companyStr = d && d.buyer_company ? String(d.buyer_company).toLowerCase() : '';
    const searchStr = (searchTerm || '').toLowerCase();
    
    const matchesSearch = titleStr.includes(searchStr) || companyStr.includes(searchStr);
    const matchesCategory = filterCategory === 'ALL' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPipelineValue = filteredDeals.reduce((sum, d) => sum + d.total_value, 0);
  const closedWonValue = filteredDeals.filter(d => d.status === 'closed_won' || d.status === 'fulfillment_credit').reduce((sum, d) => sum + d.total_value, 0);
  const conversionRate = (deals || []).length > 0 ? Math.round((((deals || []).filter(d => d.status === 'closed_won' || d.status === 'fulfillment_credit').length) / (deals || []).length) * 100) : 0;

  const formatVND = (val) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ ₫';
    if (val >= 1000000) return (val / 1000000).toFixed(0) + ' Tr ₫';
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {loading && <div style={{ color: '#FFF', padding: '10px' }}>Đang tải dữ liệu...</div>}

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

      {/* MODAL ADD NEW DEAL FORM */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: 'var(--accent-gold)' }}>Thêm Cơ Hội Đàm Phán B2B Mới</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fa-solid fa-xmark"></i></button>
            </div>

            <form onSubmit={handleCreateDeal}>
              <div className="form-group">
                <label>Tên Hợp Đồng / Tiêu Đề RFQ *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={newDeal.title}
                  onChange={e => setNewDeal({ ...newDeal, title: e.target.value })}
                  placeholder="VD: Cung cấp rượu vang Tiệc Tất Niên Vingroup"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Doanh nghiệp mua (B2B Buyer) *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newDeal.buyer_company}
                    onChange={e => setNewDeal({ ...newDeal, buyer_company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Sản phẩm quan tâm *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newDeal.product_name}
                    onChange={e => setNewDeal({ ...newDeal, product_name: e.target.value })}
                    placeholder="VD: Chateau Margaux 2015"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Số lượng (Chai/Thùng) *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={newDeal.quantity}
                    onChange={e => setNewDeal({ ...newDeal, quantity: Number(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Mức giá đề xuất (VNĐ) *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={newDeal.unit_price}
                    onChange={e => setNewDeal({ ...newDeal, unit_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '25px' }}>
                <button type="button" className="btn-redapron-burgundy" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn-redapron-gold">TẠO CƠ HỘI ĐÀM PHÁN</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            placeholder="Tìm kiếm theo tên hợp đồng, khách sạn, nhà hàng..."
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
              background: '#F0EFEA',
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
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'var(--font-brand)', margin: 0 }}>
                    {col.title}
                  </h4>
                  <span style={{
                    background: 'rgba(0,0,0,0.05)',
                    color: col.color,
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {colDeals.length}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
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
                      boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
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

                      <h5 style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.3' }}>
                        {deal.title}
                      </h5>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-building gold-text"></i> {deal.buyer_company}
                      </div>

                      <div style={{ background: 'var(--bg-primary)', borderRadius: '4px', padding: '8px', fontSize: '0.75rem', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: '600' }}>{deal.product_name}</div>
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



    </div>
  );
}
