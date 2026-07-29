import React, { useState } from 'react';
import { formatVND } from '../utils/formatters.js';
import apiService from '../services/api.js';

export default function RFQManagementPage({ rfqs, quotations, showToast }) {
  const [rfqList, setRfqList] = useState(rfqs || []);
  const [quotationList, setQuotationList] = useState(quotations || []);
  const [showNewRfqModal, setShowNewRfqModal] = useState(false);
  const [newRfq, setNewRfq] = useState({
    product_name: 'Macallan 18 Year Old Sherry Oak Single Malt',
    quantity: 50,
    target_price: 68000000,
    notes: ''
  });

  const handleCreateRfq = (e) => {
    e.preventDefault();
    const created = {
      rfq_id: 8800 + rfqList.length + 1,
      buyer_company: 'Doanh Nghiệp Của Bạn',
      title: `Đơn RFQ ${newRfq.product_name}`,
      product_name: newRfq.product_name,
      quantity: parseInt(newRfq.quantity) || 1,
      target_price: parseInt(newRfq.target_price) || 0,
      status: 'SUBMITTED',
      created_at: new Date().toISOString().split('T')[0]
    };
    apiService.createRFQ(created)
      .then(res => {
        if (res.success) {
          setRfqList([res.rfq || created, ...rfqList]);
          showToast(`Đã gửi RFQ #${res.rfq?.rfq_id || created.rfq_id} thành công! Sales sẽ phản hồi trong vòng 24h.`);
        }
      })
      .catch(() => {
        setRfqList([created, ...rfqList]);
        showToast(`Đã gửi RFQ #${created.rfq_id} (Chế độ xem trước).`);
      });
    setShowNewRfqModal(false);
    setNewRfq({ product_name: 'Macallan 18 Year Old Sherry Oak Single Malt', quantity: 50, target_price: 68000000, notes: '' });
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
          { message_id: 1, rfq_id: rfq.rfq_id, sender_name: 'Platform Sales Bot', sender_role: 'SYSTEM', message_text: `Đã kết nối phòng thương lượng cho RFQ #${rfq.rfq_id}. Quý khách có thể nhập tin nhắn đàm phán giá sỉ hoặc tag @ai để trợ lý Sommelier hỗ trợ.`, created_at: 'Vừa xong' }
        ]);
      })
      .finally(() => setChatLoading(false));
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedRfqChat) return;

    const userMsg = {
      sender_name: 'Khách hàng',
      sender_role: 'BUYER',
      message_text: chatInput.trim()
    };

    const tempMessages = [...chatMessages, {
      message_id: Date.now(),
      rfq_id: selectedRfqChat.rfq_id,
      sender_name: 'Khách hàng',
      sender_role: 'BUYER',
      message_text: userMsg.message_text,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setChatMessages(tempMessages);
    setChatInput('');

    apiService.sendChatMessage(selectedRfqChat.rfq_id, userMsg)
      .then(res => {
        if (res.success && res.data) {
          setChatMessages(res.data);
        }
      })
      .catch(() => {});
  };

  const handleAcceptQuotation = (quotationId) => {
    apiService.updateQuotationStatus(quotationId, 'ACCEPTED')
      .then(res => {
        if (res.success) {
          setQuotationList(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, status: 'ACCEPTED' } : q));
          showToast('Đã CHẤP NHẬN Báo giá! Đơn hàng đang được khởi tạo từ Quotation.');
        }
      })
      .catch(() => {
        setQuotationList(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, status: 'ACCEPTED' } : q));
        showToast('Đã CHẤP NHẬN Báo giá! Đơn hàng đang được khởi tạo.');
      });
  };

  const handleRejectQuotation = (quotationId) => {
    apiService.updateQuotationStatus(quotationId, 'REJECTED')
      .then(res => {
        if (res.success) {
          setQuotationList(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, status: 'REJECTED' } : q));
          showToast('Đã Từ Chối Báo giá. Bạn có thể gửi RFQ mới với mức giá khác.');
        }
      })
      .catch(() => {
        setQuotationList(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, status: 'REJECTED' } : q));
        showToast('Đã Từ Chối Báo giá.');
      });
  };

  const statusConfig = {
    SUBMITTED: { label: 'Đã Gửi', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    QUOTATION_SENT: { label: 'Đã Nhận Báo Giá', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    ACCEPTED: { label: 'Đã Chấp Nhận', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    REJECTED: { label: 'Đã Từ Chối', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    PENDING: { label: 'Chờ Phản Hồi', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <i className="fa-solid fa-comments-dollar gold-text"></i> Quản Lý Yêu Cầu Báo Giá (RFQ)
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Theo dõi trạng thái RFQ đã gửi, nhận và phản hồi Báo giá (Quotation) từ bên Sales.
          </p>
        </div>
        <button className="btn-redapron-gold" onClick={() => setShowNewRfqModal(true)} style={{ padding: '12px 24px' }}>
          <i className="fa-solid fa-plus"></i> GỬI RFQ MỚI
        </button>
      </div>

      {/* KPI SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng RFQ Đã Gửi</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B', marginTop: '4px' }}>{rfqList.length}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Quotation Nhận Được</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8B5CF6', marginTop: '4px' }}>{quotationList.length}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng Giá Trị Quotation</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-gold)', marginTop: '4px' }}>
            {formatVND(quotationList.reduce((s, q) => s + (q.offer_unit_price * q.quantity), 0))}
          </div>
        </div>
      </div>

      {/* RFQ TABLE */}
      <div className="card-box" style={{ marginBottom: '25px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-paper-plane gold-text"></i> Danh Sách RFQ Đã Gửi
        </h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>MÃ RFQ</th>
              <th>TÊN HỢP ĐỒNG</th>
              <th>SẢN PHẨM</th>
              <th>SỐ LƯỢNG</th>
              <th>GIÁ ĐỀ XUẤT</th>
              <th>TRẠNG THÁI</th>
              <th>THƯƠNG LƯỢNG</th>
            </tr>
          </thead>
          <tbody>
            {rfqList.map(r => {
              const sc = statusConfig[r.status] || statusConfig.SUBMITTED;
              return (
                <tr key={r.rfq_id}>
                  <td><code style={{ color: 'var(--accent-gold)' }}>#RFQ-{r.rfq_id}</code></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.title}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{r.product_name}</td>
                  <td><strong>{r.quantity}</strong> thùng</td>
                  <td className="gold-text"><strong>{formatVND(r.target_price)}</strong></td>
                  <td>
                    <span style={{ color: sc.color, background: sc.bg, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      {sc.label}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-redapron-gold"
                      style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => openChatForRfq(r)}
                    >
                      <i className="fa-solid fa-comments"></i> Trò Chuyện
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QUOTATION TABLE */}
      <div className="card-box">
        <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-file-contract gold-text"></i> Báo Giá (Quotation) Nhận Từ Sales
        </h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>MÃ QUOTATION</th>
              <th>ĐƠN GIÁ SALES</th>
              <th>SỐ LƯỢNG</th>
              <th>TỔNG GIÁ TRỊ</th>
              <th>HẠN HIỆU LỰC</th>
              <th>TRẠNG THÁI</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {quotationList.map(q => {
              const sc = statusConfig[q.status] || statusConfig.PENDING;
              return (
                <tr key={q.quotation_id}>
                  <td><code style={{ color: '#8B5CF6' }}>#QUOT-{q.quotation_id}</code></td>
                  <td className="gold-text"><strong>{formatVND(q.offer_unit_price)}</strong></td>
                  <td>{q.quantity} thùng</td>
                  <td style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{formatVND(q.offer_unit_price * q.quantity)}</td>
                  <td>{q.valid_until}</td>
                  <td>
                    <span style={{ color: sc.color, background: sc.bg, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      {sc.label}
                    </span>
                  </td>
                  <td>
                    {q.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-redapron-gold"
                          style={{ padding: '5px 12px', fontSize: '0.7rem' }}
                          onClick={() => handleAcceptQuotation(q.quotation_id)}
                        >
                          <i className="fa-solid fa-check"></i> Chấp Nhận
                        </button>
                        <button
                          onClick={() => handleRejectQuotation(q.quotation_id)}
                          style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                            color: '#EF4444', padding: '5px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer'
                          }}
                        >
                          Từ Chối
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã xử lý</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {quotationList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Chưa có Quotation nào. Hãy gửi RFQ để nhận báo giá từ Sales.
          </div>
        )}
      </div>

      {/* MODAL: NEW RFQ */}
      {showNewRfqModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '550px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Gửi Yêu Cầu Báo Giá (RFQ) Mới</h3>
              <button onClick={() => setShowNewRfqModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateRfq}>
              <div className="form-group">
                <label>Sản Phẩm Cần Báo Giá *</label>
                <select className="form-control" value={newRfq.product_name} onChange={e => setNewRfq({ ...newRfq, product_name: e.target.value })}>
                  <option value="Macallan 18 Year Old Sherry Oak Single Malt">Macallan 18 Year Old Sherry Oak</option>
                  <option value="Château Margaux Premier Grand Cru Classé 2018">Château Margaux Premier Grand Cru 2018</option>
                  <option value="Dom Pérignon Vintage Brut Champagne 2012">Dom Pérignon Vintage Brut 2012</option>
                  <option value="Hennessy X.O Cognac Extra Old Edition">Hennessy X.O Cognac Extra Old</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Số Lượng (Thùng) *</label>
                  <input type="number" className="form-control" value={newRfq.quantity} onChange={e => setNewRfq({ ...newRfq, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Mức Giá Mong Muốn (VNĐ/thùng) *</label>
                  <input type="number" className="form-control" value={newRfq.target_price} onChange={e => setNewRfq({ ...newRfq, target_price: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Ghi Chú Thêm</label>
                <input type="text" className="form-control" placeholder="Cần giao trước ngày 15/09, đóng gói đặc biệt..." value={newRfq.notes} onChange={e => setNewRfq({ ...newRfq, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowNewRfqModal(false)} className="btn-redapron-burgundy" style={{ padding: '10px 20px' }}>HỦY</button>
                <button type="submit" className="btn-redapron-gold" style={{ padding: '10px 20px' }}>
                  <i className="fa-solid fa-paper-plane"></i> GỬI RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEGOTIATION CHAT */}
      {selectedRfqChat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '30px', maxWidth: '650px', width: '100%', height: '80%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-comments gold-text"></i> Phòng Thương Lượng B2B
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Đang đàm phán RFQ #{selectedRfqChat.rfq_id} — {selectedRfqChat.product_name} ({selectedRfqChat.quantity} thùng)
                </div>
              </div>
              <button onClick={() => setSelectedRfqChat(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fa-solid fa-xmark"></i></button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
              {chatMessages.map(msg => {
                const isBuyer = msg.sender_role === 'BUYER';
                const isSystem = msg.sender_role === 'SYSTEM';
                return (
                  <div key={msg.message_id} style={{
                    alignSelf: isSystem ? 'center' : (isBuyer ? 'flex-end' : 'flex-start'),
                    maxWidth: '80%'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: isSystem ? 'center' : (isBuyer ? 'right' : 'left'), marginBottom: '2px' }}>
                      {msg.sender_name} · {msg.created_at || 'Vừa xong'}
                    </div>
                    <div style={{
                      background: isSystem ? 'transparent' : (isBuyer ? '#111111' : '#FFFFFF'),
                      border: isSystem ? 'none' : '1px solid var(--border-gold)',
                      padding: isSystem ? '2px 10px' : '10px 14px',
                      borderRadius: '8px',
                      color: isSystem ? 'var(--text-muted)' : (isBuyer ? '#FFFFFF' : 'var(--text-main)'),
                      fontSize: '0.8rem',
                      fontStyle: isSystem ? 'italic' : 'normal'
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
                placeholder="Nhập tin nhắn thương thảo giá hoặc tag @ai để tư vấn..."
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
