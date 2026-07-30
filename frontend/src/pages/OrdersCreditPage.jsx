import React, { useState, useEffect } from 'react';
import { formatVND } from '../utils/formatters.js';
import apiService from '../services/api.js';

export default function OrdersCreditPage({ orders, credit, invoices, showToast }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'invoices' | 'credit' | 'lc'
  const [invoiceList, setInvoiceList] = useState(invoices || []);
  const [creditState, setCreditState] = useState(credit || { total_limit: 0, used_amount: 0, available_balance: 0 });
  const [lcDocs, setLcDocs] = useState([]);
  const [lcNumber, setLcNumber] = useState('');
  const [lcBank, setLcBank] = useState('');
  const [lcAmount, setLcAmount] = useState('');
  const [lcExpiry, setLcExpiry] = useState('');
  const [loadingLc, setLoadingLc] = useState(false);

  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lcRes, ordersRes, creditRes] = await Promise.all([
        apiService.getLCDocuments(),
        apiService.getOrders(),
        apiService.getCreditLimit()
      ]);

      if (lcRes.success && lcRes.data) {
        setLcDocs(lcRes.data);
      }
      
      if (ordersRes.success && ordersRes.data) {
        setOrdersList(ordersRes.data);
      }
      
      if (creditRes.success) {
        if (creditRes.credit) setCreditState(creditRes.credit);
        if (creditRes.invoices) setInvoiceList(creditRes.invoices);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Lỗi tải dữ liệu Đơn hàng & Công nợ');
    } finally {
      setLoading(false);
    }
  };

  const fetchLcDocs = async () => {
    try {
      const res = await apiService.getLCDocuments();
      if (res.success && res.data) {
        setLcDocs(res.data);
      }
    } catch (err) {
      console.error('Error fetching L/C docs:', err);
    }
  };

  const handleSubmitLc = async (e) => {
    e.preventDefault();
    if (!lcNumber || !lcBank || !lcAmount || !lcExpiry) {
      showToast('Vui lòng điền đầy đủ thông tin Thư tín dụng L/C.');
      return;
    }

    setLoadingLc(true);
    try {
      const res = await apiService.submitLCDocument({
        lc_number: lcNumber,
        issuing_bank: lcBank,
        amount: parseFloat(lcAmount),
        expiry_date: lcExpiry,
        document_url: `/uploads/lc_${lcNumber.toLowerCase()}.pdf`
      });

      if (res.success) {
        showToast(res.message || 'Đã nộp L/C thành công!');
        setLcNumber('');
        setLcBank('');
        setLcAmount('');
        setLcExpiry('');
        fetchData();
      }
    } catch (err) {
      showToast('Lỗi khi gửi tài liệu L/C. Vui lòng thử lại.');
    } finally {
      setLoadingLc(false);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    try {
      const res = await apiService.payInvoice(invoiceId);
      if (res.success) {
        showToast(res.message);
        fetchData(); // Refresh all state
      } else {
        showToast(res.message);
      }
    } catch (err) {
      showToast('Lỗi khi thanh toán hóa đơn');
    }
  };

  const usedPercent = creditState.total_limit > 0 ? Math.round((creditState.used_amount / creditState.total_limit) * 100) : 0;
  const creditWarning = usedPercent >= 80;

  const statusConfig = {
    DELIVERED: { label: 'Đã Giao Hàng', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    PROCESSING: { label: 'Đang Xử Lý', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    SHIPPED: { label: 'Đang Vận Chuyển', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    CANCELLED: { label: 'Đã Hủy', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      {loading && <div style={{ color: '#FFF', padding: '10px' }}>Đang tải dữ liệu...</div>}
      {/* HEADER */}
      <div style={{ marginBottom: '25px' }}>
        <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          <i className="fa-solid fa-file-invoice-dollar gold-text"></i> Quản Lý Đơn Hàng & Công Nợ Net-30
        </h2>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Theo dõi lịch sử đơn hàng, chi tiết sản phẩm, trạng thái thanh toán và hạn mức tín dụng doanh nghiệp.
        </p>
      </div>

      {/* CREDIT LIMIT OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng Hạn Mức Cấp</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-gold)', marginTop: '6px' }}>{formatVND(creditState.total_limit)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>Phương thức: Net-30 Credit</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${creditWarning ? 'rgba(239,68,68,0.5)' : 'var(--border-gold)'}`, borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Công Nợ Đang Dùng</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: creditWarning ? '#EF4444' : '#F59E0B', marginTop: '6px' }}>{formatVND(creditState.used_amount)}</div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', marginTop: '8px' }}>
            <div style={{ width: `${Math.min(100, usedPercent)}%`, height: '100%', borderRadius: '3px', background: creditWarning ? '#9F2F2D' : '#B25E00', transition: 'width 0.5s ease' }}></div>
          </div>
          <div style={{ fontSize: '0.7rem', color: creditWarning ? '#9F2F2D' : 'var(--text-muted)', marginTop: '4px' }}>
            {usedPercent}% hạn mức đã sử dụng {creditWarning && <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: '4px' }}></i>}
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Số Dư Khả Dụng</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#10B981', marginTop: '6px' }}>{formatVND(creditState.available_balance)}</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '3px' }}>Còn lại có thể đặt hàng</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hóa Đơn Chưa TT</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#8B5CF6', marginTop: '6px' }}>
            {(invoiceList || []).filter(i => i.status === 'UNPAID').length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {formatVND((invoiceList || []).filter(i => i.status === 'UNPAID').reduce((s, i) => s + i.amount, 0))} tổng giá trị
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-gold)', marginBottom: '25px', gap: '5px' }}>
        {[
          { id: 'orders', label: 'Đơn Hàng', icon: 'fa-boxes-stacked' },
          { id: 'invoices', label: 'Hóa Đơn & Thanh Toán', icon: 'fa-receipt' },
          { id: 'credit', label: 'Chi Tiết Hạn Mức', icon: 'fa-credit-card' },
          { id: 'lc', label: 'Bảo Lãnh L/C Ngân Hàng', icon: 'fa-file-shield' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '12px 22px',
            background: activeTab === tab.id ? 'var(--accent-burgundy)' : 'transparent',
            color: activeTab === tab.id ? '#FFF' : 'var(--text-muted)',
            border: 'none', borderTopLeftRadius: '6px', borderTopRightRadius: '6px',
            fontFamily: 'var(--font-brand)', fontSize: '0.8rem', letterSpacing: '1px',
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <i className={`fa-solid ${tab.icon}`} style={{ marginRight: '6px' }}></i> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="card-box">
          <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-boxes-stacked gold-text"></i> Lịch Sử Đơn Hàng Sỉ
          </h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ ĐƠN</th>
                <th>NGÀY ĐẶT</th>
                <th>SẢN PHẨM</th>
                <th>SỐ LƯỢNG</th>
                <th>TỔNG GIÁ TRỊ</th>
                <th>TRẠNG THÁI ĐƠN</th>
                <th>THANH TOÁN</th>
                <th>NGÀY GIAO</th>
              </tr>
            </thead>
            <tbody>
              {(ordersList || []).map(order => {
                const sc = statusConfig[order.order_status] || statusConfig.PROCESSING;
                return (
                  <tr key={order.order_id}>
                    <td><code style={{ color: 'var(--accent-gold)' }}>{order.order_number}</code></td>
                    <td>{order.created_at}</td>
                    <td>
                      {order.items ? order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {item.product_name}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Đơn giá: {formatVND(item.unit_price)}
                          </div>
                        </div>
                      )) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><strong>{order.items ? order.items.reduce((s, i) => s + i.quantity, 0) : '—'}</strong> {order.items ? 'thùng' : ''}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{formatVND(order.total_amount)}</td>
                    <td>
                      <span style={{ color: sc.color, background: sc.bg, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: order.payment_status === 'PAID' ? '#10B981' : '#F59E0B',
                        fontSize: '0.75rem', fontWeight: '600'
                      }}>
                        {order.payment_status === 'PAID' ? 'Đã TT' : 'Chưa TT'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {order.delivered_at || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="card-box">
          <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-receipt gold-text"></i> Danh Sách Hóa Đơn & Thanh Toán
          </h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ HÓA ĐƠN</th>
                <th>MÃ ĐƠN HÀNG</th>
                <th>NGÀY HẠN</th>
                <th>GIÁ TRỊ</th>
                <th>TRẠNG THÁI</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {(invoiceList || []).map(inv => {
                const isOverdue = inv.status === 'UNPAID' && new Date(inv.due_date) < new Date();
                return (
                  <tr key={inv.invoice_id}>
                    <td><code style={{ color: 'var(--accent-gold)' }}>{inv.invoice_number}</code></td>
                    <td>{inv.order_number}</td>
                    <td>
                      {inv.due_date}
                      {isOverdue && (
                        <div style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: '700' }}>Quá hạn!</div>
                      )}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{formatVND(inv.amount)}</td>
                    <td>
                      {inv.status === 'PAID' ? (
                        <span style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>Đã Thanh Toán</span>
                      ) : (
                        <span style={{ color: isOverdue ? '#EF4444' : '#F59E0B', background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                          {isOverdue ? 'Quá Hạn' : 'Chờ Thanh Toán'}
                        </span>
                      )}
                    </td>
                    <td>
                      {inv.status !== 'PAID' && (
                        <button className="btn-redapron-gold" style={{ padding: '6px 14px', fontSize: '0.75rem' }} onClick={() => handlePayInvoice(inv.invoice_id)}>
                          <i className="fa-solid fa-check"></i> Thanh Toán Ngay
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: CREDIT DETAILS */}
      {activeTab === 'credit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card-box">
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px' }}>
              <i className="fa-solid fa-info-circle gold-text"></i> Thông Tin Hạn Mức
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Loại hạn mức', value: 'Net-30 (Trả sau 30 ngày)', color: 'var(--text-main)' },
                { label: 'Tổng hạn mức được duyệt', value: formatVND(creditState.total_limit), color: 'var(--accent-gold)' },
                { label: 'Dư nợ đang sử dụng', value: formatVND(creditState.used_amount), color: '#F59E0B' },
                { label: 'Số dư khả dụng còn lại', value: formatVND(creditState.available_balance), color: '#10B981' },
                { label: 'Tỷ lệ sử dụng', value: `${usedPercent}%`, color: creditWarning ? '#EF4444' : 'var(--text-main)' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.label}</span>
                  <strong style={{ color: item.color, fontSize: '0.85rem' }}>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card-box">
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px' }}>
              <i className="fa-solid fa-gavel gold-text"></i> Quy Tắc Tín Dụng Tự Động
            </h4>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: 2 }}>
              <li>Khóa thanh toán Net-30 khi Dư Nợ ≥ 100% Hạn mức.</li>
              <li>Tự động chuyển sang <strong style={{ color: 'var(--text-main)' }}>Pre-payment (Trả trước)</strong> nếu có hóa đơn quá hạn 30 ngày.</li>
              <li>Gửi cảnh báo Email tự động <strong style={{ color: '#F59E0B' }}>trước 5 ngày</strong> đến hạn thanh toán.</li>
              <li>Hạn mức tín dụng sẽ được khôi phục ngay lập tức khi thanh toán hóa đơn.</li>
              <li>Yêu cầu Giấy phép Rượu hợp lệ theo NĐ 105/2017/NĐ-CP để kích hoạt.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: LETTER OF CREDIT (L/C) */}
      {activeTab === 'lc' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', alignItems: 'start' }}>
          {/* Submit L/C Form */}
          <div className="card-box">
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-file-invoice-dollar gold-text"></i> Nộp Thư Tín Dụng L/C
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
              Gửi tài liệu L/C do ngân hàng thương mại phát hành để tạm thời hoặc vĩnh viễn gia tăng hạn mức công nợ sỉ B2B.
            </p>
            <form onSubmit={handleSubmitLc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '500' }}>Số Thư Tín Dụng (L/C Number)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', fontSize: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-gold)', color: 'var(--text-main)', borderRadius: '4px' }}
                  placeholder="Ví dụ: LC-HSBC-2026-9912"
                  value={lcNumber}
                  onChange={e => setLcNumber(e.target.value)}
                  disabled={loadingLc}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '500' }}>Ngân Hàng Phát Hành</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', fontSize: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-gold)', color: 'var(--text-main)', borderRadius: '4px' }}
                  placeholder="Ví dụ: HSBC Việt Nam, Vietcombank..."
                  value={lcBank}
                  onChange={e => setLcBank(e.target.value)}
                  disabled={loadingLc}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '500' }}>Giá Trị Bảo Lãnh (VNĐ)</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', fontSize: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-gold)', color: 'var(--text-main)', borderRadius: '4px' }}
                  placeholder="Ví dụ: 1000000000"
                  value={lcAmount}
                  onChange={e => setLcAmount(e.target.value)}
                  disabled={loadingLc}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '500' }}>Ngày Hết Hạn</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', fontSize: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-gold)', color: 'var(--text-main)', borderRadius: '4px' }}
                  value={lcExpiry}
                  onChange={e => setLcExpiry(e.target.value)}
                  disabled={loadingLc}
                />
              </div>
              <button
                type="submit"
                className="btn-redapron-gold"
                style={{ width: '100%', padding: '12px', fontSize: '0.8rem', marginTop: '10px', background: '#111111', color: '#FFFFFF', border: '1px solid #111111' }}
                disabled={loadingLc}
              >
                {loadingLc ? 'Đang gửi...' : 'Gửi Yêu Cầu Phê Duyệt'}
              </button>
            </form>
          </div>

          {/* L/C History Table */}
          <div className="card-box">
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-list-check gold-text"></i> Danh Sách L/C Đã Nộp
            </h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SỐ L/C</th>
                  <th>NGÂN HÀNG</th>
                  <th>GIÁ TRỊ (VNĐ)</th>
                  <th>HẠN DÙNG</th>
                  <th>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {(!lcDocs || lcDocs.length === 0) ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                      Chưa có tài liệu L/C nào được nộp.
                    </td>
                  </tr>
                ) : (
                  (lcDocs || []).map(doc => {
                    let statusColor = '#F59E0B';
                    let statusBg = 'rgba(245,158,11,0.1)';
                    let statusText = 'Chờ Thẩm Định';
                    if (doc.status === 'VERIFIED') {
                      statusColor = '#10B981';
                      statusBg = 'rgba(16,185,129,0.1)';
                      statusText = 'Đã Phê Duyệt';
                    } else if (doc.status === 'REJECTED') {
                      statusColor = '#EF4444';
                      statusBg = 'rgba(239,68,68,0.1)';
                      statusText = 'Từ Chối';
                    }
                    return (
                      <tr key={doc.lc_id}>
                        <td><strong>{doc.lc_number}</strong></td>
                        <td>{doc.issuing_bank}</td>
                        <td className="gold-text"><strong>{formatVND(doc.amount)}</strong></td>
                        <td>{doc.expiry_date}</td>
                        <td>
                          <span style={{ color: statusColor, background: statusBg, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '500' }}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
