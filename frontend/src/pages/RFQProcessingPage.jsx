import React, { useState, useEffect } from 'react';
import { formatVND } from '../utils/formatters.js';
import apiService from '../services/api.js';

export default function RFQProcessingPage({ rfqs, showToast }) {
  const [rfqList, setRfqList] = useState(rfqs || []);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ offer_price: '', notes: '' });
  const [quotationsSent, setQuotationsSent] = useState([]);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      const res = await apiService.getRFQs();
      if (res.success && res.data) {
        setRfqList(res.data);
      }
      const prodRes = await apiService.getProducts();
      if (prodRes.success && prodRes.data) {
        setAvailableProducts(prodRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleOpenQuote = (rfq) => {
    setSelectedRfq(rfq);
    setQuoteForm({ offer_price: String(rfq.target_price), notes: '' });
    setShowQuoteModal(true);
  };

  const handleSendQuotation = (e) => {
    e.preventDefault();
    const offerPrice = parseFloat(quoteForm.offer_price);
    if (!offerPrice || offerPrice <= 0) {
      showToast('Vui lòng nhập đơn giá đề xuất hợp lệ!');
      return;
    }

    const margin = selectedRfq.target_price > 0 
      ? ((offerPrice - selectedRfq.target_price) / selectedRfq.target_price * 100).toFixed(1) 
      : 0;

    const quotation = {
      quotation_id: 9900 + quotationsSent.length + 1,
      rfq_id: selectedRfq.rfq_id,
      buyer_company: selectedRfq.buyer_company,
      product_name: selectedRfq.product_name,
      quantity: selectedRfq.quantity,
      target_price: selectedRfq.target_price,
      offer_price: offerPrice,
      total_value: offerPrice * selectedRfq.quantity,
      margin_percent: margin,
      notes: quoteForm.notes,
      status: 'SENT',
      created_at: new Date().toISOString().split('T')[0]
    };

    const payload = {
      rfq_id: selectedRfq.rfq_id,
      offer_unit_price: offerPrice,
      quantity: selectedRfq.quantity,
      product_id: selectedRfq.product_id || 101,
      notes: quoteForm.notes
    };

    setQuotationsSent(prev => [quotation, ...prev]);
    setRfqList(prev => prev.map(r => r.rfq_id === selectedRfq.rfq_id ? { ...r, status: 'QUOTATION_SENT' } : r));

    apiService.createQuotation(payload)
      .then(res => {
        if (res.success) {
          showToast(`Đã phát hành Báo giá Quotation #${res.quotation?.quotation_id || quotation.quotation_id} cho RFQ #${selectedRfq.rfq_id}!`);
          fetchRFQs();
        }
      })
      .catch(err => {
        showToast(`Đã phát hành Báo giá Quotation #${quotation.quotation_id} cho RFQ #${selectedRfq.rfq_id}!`);
      });

    setShowQuoteModal(false);
    setSelectedRfq(null);
  };

  const handleOpenReject = (rfq) => {
    setSelectedRfq(rfq);
    setRejectReason('');
    setSuggestedProducts([]);
    setShowRejectModal(true);
  };

  const handleRejectRFQ = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối!');
      return;
    }
    try {
      const res = await apiService.rejectRFQ({
        rfq_id: selectedRfq.rfq_id,
        reason: rejectReason,
        suggested_product_ids: suggestedProducts
      });
      if (res.success) {
        showToast(`Đã từ chối RFQ #${selectedRfq.rfq_id}`);
        fetchRFQs();
        setShowRejectModal(false);
        setSelectedRfq(null);
      }
    } catch (err) {
      showToast('Lỗi khi từ chối RFQ');
    }
  };

  const [selectedRfqChat, setSelectedRfqChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const openChatForRfq = (rfq) => {
    setSelectedRfqChat(rfq);
    setChatLoading(true);
    apiService.getChatMessages(rfq.rfq_id)
      .then(res => {
        if (res.success && res.data) {
          setChatMessages(res.data);
        }
      })
      .catch(() => {
        setChatMessages([
          { message_id: 1, rfq_id: rfq.rfq_id, sender_name: 'Platform Sales Bot', sender_role: 'SYSTEM', message_text: `Đã kết nối phòng thương lượng cho RFQ #${rfq.rfq_id}. Bạn đang trò chuyện với Buyer Rep của đối tác.`, created_at: 'Vừa xong' }
        ]);
      })
      .finally(() => setChatLoading(false));
  };

  useEffect(() => {
    if (!selectedRfqChat) return;
    const interval = setInterval(() => {
      apiService.getChatMessages(selectedRfqChat.rfq_id)
        .then(res => {
          if (res.success && res.data) {
            setChatMessages(res.data);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedRfqChat]);

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedRfqChat) return;

    const repMsg = {
      sender_name: 'Sales Rep',
      sender_role: 'SALES_REP',
      message_text: chatInput.trim()
    };

    const tempMessages = [...chatMessages, {
      message_id: Date.now(),
      rfq_id: selectedRfqChat.rfq_id,
      sender_name: 'Sales Rep',
      sender_role: 'SALES_REP',
      message_text: repMsg.message_text,
      created_at: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    }];
    setChatMessages(tempMessages);
    setChatInput('');

    apiService.sendChatMessage(selectedRfqChat.rfq_id, repMsg)
      .then(res => {
        if (res.success && res.data) {
          setChatMessages(res.data);
        }
      })
      .catch(() => {});
  };

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '25px' }}>
        <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          <i className="fa-solid fa-comments-dollar gold-text"></i> Xử Lý RFQ & Phát Hành Báo Giá
        </h2>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Tiếp nhận Yêu cầu Báo giá (RFQ) từ khách hàng, tính toán biên lợi nhuận & phát hành Quotation chính thức.
        </p>
      </div>

      {/* KPI METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>RFQ Chờ Xử Lý</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B', marginTop: '4px' }}>
            {rfqList.filter(r => r.status === 'SUBMITTED').length}
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Đã Gửi Báo Giá</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8B5CF6', marginTop: '4px' }}>
            {quotationsSent.length}
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng Giá Trị Báo Giá</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-gold)', marginTop: '4px' }}>
            {formatVND(quotationsSent.reduce((sum, q) => sum + q.total_value, 0))}
          </div>
        </div>
      </div>

      {/* RFQ TABLE */}
      <div className="card-box" style={{ marginBottom: '25px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-inbox gold-text"></i> Danh Sách RFQ Tiếp Nhận
        </h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>MÃ RFQ</th>
              <th>KHÁCH HÀNG MUA</th>
              <th>TÊN HỢP ĐỒNG</th>
              <th>SẢN PHẨM</th>
              <th>SỐ LƯỢNG</th>
              <th>GIÁ KHÁCH ĐỀ XUẤT</th>
              <th>TRẠNG THÁI</th>
              <th>HÀNH ĐỘNG SALES</th>
              <th>THƯƠNG LƯỢNG</th>
            </tr>
          </thead>
          <tbody>
            {rfqList.map(r => (
              <tr key={r.rfq_id}>
                <td><code style={{ color: 'var(--accent-gold)' }}>#RFQ-{r.rfq_id}</code></td>
                <td style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.85rem' }}>{r.buyer_company}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.title}</td>
                <td>{r.product_name}</td>
                <td><strong>{r.quantity}</strong> thùng</td>
                <td className="gold-text"><strong>{formatVND(r.target_price)}</strong></td>
                <td>
                  {r.status === 'SUBMITTED' && (
                    <span style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      Chờ Xử Lý
                    </span>
                  )}
                  {r.status === 'QUOTATION_SENT' && (
                    <span style={{ color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      Đã Gửi Báo Giá
                    </span>
                  )}
                </td>
                <td>
                  {r.status === 'SUBMITTED' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-redapron-gold"
                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                        onClick={() => handleOpenQuote(r)}
                      >
                        <i className="fa-solid fa-paper-plane"></i> Báo Giá
                      </button>
                      <button
                        className="btn-redapron-burgundy"
                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                        onClick={() => handleOpenReject(r)}
                      >
                        <i className="fa-solid fa-times"></i> Từ Chối
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã xử lý</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn-redapron-gold"
                    style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => openChatForRfq(r)}
                  >
                    <i className="fa-solid fa-comments"></i> Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SENT QUOTATIONS TABLE */}
      {quotationsSent.length > 0 && (
        <div className="card-box">
          <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-file-contract gold-text"></i> Báo Giá Đã Phát Hành
          </h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ QUOTATION</th>
                <th>RFQ GỐC</th>
                <th>SẢN PHẨM</th>
                <th>SỐ LƯỢNG</th>
                <th>GIÁ KHÁCH MUỐN</th>
                <th>GIÁ BÁO</th>
                <th>BIÊN LN</th>
                <th>TỔNG GIÁ TRỊ</th>
                <th>NGÀY GỬI</th>
              </tr>
            </thead>
            <tbody>
              {quotationsSent.map(q => (
                <tr key={q.quotation_id}>
                  <td><code style={{ color: '#8B5CF6' }}>#QUOT-{q.quotation_id}</code></td>
                  <td><code style={{ color: 'var(--text-muted)' }}>#RFQ-{q.rfq_id}</code></td>
                  <td>{q.product_name}</td>
                  <td>{q.quantity} thùng</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatVND(q.target_price)}</td>
                  <td className="gold-text"><strong>{formatVND(q.offer_price)}</strong></td>
                  <td>
                    <span style={{
                      color: parseFloat(q.margin_percent) >= 0 ? '#10B981' : '#EF4444',
                      fontWeight: '700'
                    }}>
                      {q.margin_percent > 0 ? '+' : ''}{q.margin_percent}%
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{formatVND(q.total_value)}</td>
                  <td>{q.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CREATE QUOTATION */}
      {showQuoteModal && selectedRfq && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '550px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Phát Hành Báo Giá</h3>
              <button onClick={() => setShowQuoteModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* RFQ SUMMARY */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-main)' }}>RFQ #{selectedRfq.rfq_id}</strong> — {selectedRfq.buyer_company}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600' }}>{selectedRfq.product_name}</div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>SL: <strong style={{ color: 'var(--text-main)' }}>{selectedRfq.quantity} thùng</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>Giá KH muốn: <strong className="gold-text">{formatVND(selectedRfq.target_price)}</strong></span>
              </div>
            </div>

            <form onSubmit={handleSendQuotation}>
              <div className="form-group">
                <label>Đơn Giá Báo Cho Khách (VNĐ / thùng) *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="68500000"
                  value={quoteForm.offer_price}
                  onChange={e => setQuoteForm({ ...quoteForm, offer_price: e.target.value })}
                  required
                />
              </div>

              {/* MARGIN CALCULATION PREVIEW */}
              {quoteForm.offer_price && (
                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px', marginBottom: '15px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '8px', fontFamily: 'var(--font-body)', fontWeight: '600' }}>
                    <i className="fa-solid fa-calculator"></i> TÍNH TOÁN BIÊN LỢI NHUẬN
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tổng giá trị đơn:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{formatVND(parseFloat(quoteForm.offer_price) * selectedRfq.quantity)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Biên LN so với giá KH:</span>
                    <strong style={{
                      color: (parseFloat(quoteForm.offer_price) - selectedRfq.target_price) >= 0 ? '#10B981' : '#EF4444'
                    }}>
                      {selectedRfq.target_price > 0
                        ? `${((parseFloat(quoteForm.offer_price) - selectedRfq.target_price) / selectedRfq.target_price * 100).toFixed(1)}%`
                        : '—'
                      }
                    </strong>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Ghi Chú Cho Khách</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Giá áp dụng cho đơn từ 150 thùng trở lên, hiệu lực 30 ngày..."
                  value={quoteForm.notes}
                  onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowQuoteModal(false)} className="btn-redapron-burgundy" style={{ padding: '10px 20px' }}>HỦY</button>
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>
                  <i className="fa-solid fa-paper-plane"></i> PHÁT HÀNH QUOTATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && selectedRfq && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)' }}><i className="fa-solid fa-times-circle text-danger"></i> Từ Chối Yêu Cầu Báo Giá</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleRejectRFQ} className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <p><strong>Mã RFQ:</strong> #{selectedRfq.rfq_id}</p>
                <p><strong>Sản phẩm:</strong> {selectedRfq.product_name}</p>
              </div>

              <div className="form-group">
                <label>Lý do từ chối <span style={{color: 'red'}}>*</span></label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Ví dụ: Kho đã hết hàng, giá mục tiêu quá thấp..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Sản phẩm thay thế đề xuất (Tùy chọn)</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: '4px' }}>
                  {availableProducts.slice(0, 15).map(p => (
                    <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={suggestedProducts.includes(p.product_id)}
                        onChange={(e) => {
                          if (e.target.checked) setSuggestedProducts([...suggestedProducts, p.product_id]);
                          else setSuggestedProducts(suggestedProducts.filter(id => id !== p.product_id));
                        }}
                      />
                      <img src={apiService.getMediaUrl(p.image_url)} alt={p.product_name} style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                      <span style={{ fontSize: '0.85rem' }}>{p.product_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', justifyContent: 'flex-end', display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowRejectModal(false)}>Hủy</button>
                <button type="submit" className="btn-redapron-burgundy"><i className="fa-solid fa-paper-plane"></i> Gửi Quyết Định</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEGOTIATION CHAT ROOM (FLOATING) */}
      {selectedRfqChat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '650px', width: '100%', height: '80%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-comments gold-text"></i> Thương Lượng Giá B2B (Staff View)
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Đang trao đổi với {selectedRfqChat.buyer_company} về RFQ #{selectedRfqChat.rfq_id}
                </div>
              </div>
              <button onClick={() => setSelectedRfqChat(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fa-solid fa-xmark"></i></button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
              {chatMessages.map(msg => {
                const isSales = msg.sender_role === 'SALES_REP';
                const isSystem = msg.sender_role === 'SYSTEM';
                return (
                  <div key={msg.message_id} style={{
                    alignSelf: isSystem ? 'center' : (isSales ? 'flex-end' : 'flex-start'),
                    maxWidth: '80%'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: isSystem ? 'center' : (isSales ? 'right' : 'left'), marginBottom: '2px' }}>
                      {msg.sender_name} · {msg.created_at || 'Vừa xong'}
                    </div>
                    <div style={{
                      background: isSystem ? 'transparent' : (isSales ? '#111111' : '#FFFFFF'),
                      border: isSystem ? 'none' : '1px solid var(--border-gold)',
                      padding: isSystem ? '2px 10px' : '10px 14px',
                      borderRadius: '8px',
                      color: isSystem ? 'var(--text-muted)' : (isSales ? '#FFFFFF' : 'var(--text-main)'),
                      fontSize: '0.8rem',
                      fontStyle: isSystem ? 'italic' : 'normal',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {msg.message_text}
                    </div>
                  </div>
                );
              })}
              {chatLoading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Đang tải lịch sử...</div>}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tin nhắn phản hồi đối tác..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-redapron-gold" style={{ padding: '0 20px' }}>
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
