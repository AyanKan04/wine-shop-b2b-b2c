import React, { useState, useEffect } from 'react';
import apiService from '../services/api.js';

export default function FinanceMgmtPage({ credit, invoices, showToast }) {
  const [creditData, setCreditData] = useState(credit || { total_limit: 1000000000, used_amount: 350000000, available_balance: 650000000 });
  const [invoicesList, setInvoicesList] = useState(invoices || []);
  const [newLimitInput, setNewLimitInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [lcDocs, setLcDocs] = useState([]);

  useEffect(() => {
    fetchLcDocs();
  }, []);

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

  const handleVerifyLc = async (lcId) => {
    try {
      const res = await apiService.verifyLCDocument(lcId);
      if (res.success) {
        showToast(res.message || 'Phê duyệt Thư tín dụng L/C thành công!');
        fetchLcDocs();
        // Refresh credit limit
        const creditRes = await apiService.getCreditLimit();
        if (creditRes.success && creditRes.credit) {
          setCreditData(creditRes.credit);
        }
      }
    } catch (err) {
      showToast('Lỗi khi phê duyệt tài liệu L/C.');
    }
  };

  const handleRejectLc = async (lcId) => {
    try {
      const res = await apiService.rejectLCDocument(lcId);
      if (res.success) {
        showToast(res.message || 'Đã từ chối Thư tín dụng L/C.');
        fetchLcDocs();
      }
    } catch (err) {
      showToast('Lỗi khi từ chối tài liệu L/C.');
    }
  };

  const formatVND = (val) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ ₫';
    if (val >= 1000000) return (val / 1000000).toFixed(0) + ' Tr ₫';
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  const usagePercent = creditData.total_limit > 0 ? Math.round((creditData.used_amount / creditData.total_limit) * 100) : 0;

  const handlePayInvoice = (invoiceId) => {
    setInvoicesList(prev => prev.map(inv => {
      if (inv.invoice_id === invoiceId && inv.status !== 'PAID') {
        setCreditData(prevCredit => ({
          ...prevCredit,
          used_amount: prevCredit.used_amount - inv.amount,
          available_balance: prevCredit.available_balance + inv.amount
        }));
        showToast(`Đã thanh toán hóa đơn ${inv.invoice_number} thành công! Hạn mức đã được khôi phục.`);
        return { ...inv, status: 'PAID' };
      }
      return inv;
    }));
  };

  const handleUpdateCreditLimit = (e) => {
    e.preventDefault();
    const val = parseFloat(newLimitInput);
    if (!val || val <= 0) {
      showToast('Vui lòng nhập hạn mức hợp lệ (số > 0)');
      return;
    }
    setCreditData(prev => ({
      ...prev,
      total_limit: val,
      available_balance: val - prev.used_amount
    }));
    showToast(`Đã cập nhật hạn mức tín dụng mới: ${formatVND(val)}`);
    setNewLimitInput('');
  };

  const filteredInvoices = invoicesList.filter(inv => {
    if (filterStatus === 'ALL') return true;
    return inv.status === filterStatus;
  });

  const totalInvoiced = invoicesList.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoicesList.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
  const totalUnpaid = invoicesList.filter(i => i.status === 'UNPAID').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <i className="fa-solid fa-scale-balanced gold-text"></i> Quản Lý Công Nợ & Kế Toán
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Giám sát hạn mức tín dụng Net-30, theo dõi hóa đơn và quản lý thanh toán doanh nghiệp B2B.
          </p>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hạn Mức Tín Dụng</span>
            <i className="fa-solid fa-credit-card gold-text"></i>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-gold)', marginTop: '8px' }}>{formatVND(creditData.total_limit)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Tổng hạn mức được cấp</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Dư Nợ Đang Dùng</span>
            <i className="fa-solid fa-money-bill-trend-up burgundy-text"></i>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#E54D60', marginTop: '8px' }}>{formatVND(creditData.used_amount)}</div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.06)' }}>
              <div style={{ width: `${Math.min(100, usagePercent)}%`, height: '100%', borderRadius: '3px', background: usagePercent > 80 ? '#9F2F2D' : usagePercent > 50 ? '#B25E00' : '#346538', transition: 'width 0.5s ease' }}></div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Đã dùng {usagePercent}% hạn mức</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Số Dư Khả Dụng</span>
            <i className="fa-solid fa-wallet" style={{ color: '#10B981' }}></i>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#10B981', marginTop: '8px' }}>{formatVND(creditData.available_balance)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Còn lại để đặt hàng</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hóa Đơn Chưa TT</span>
            <i className="fa-solid fa-file-invoice" style={{ color: '#F59E0B' }}></i>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#F59E0B', marginTop: '8px' }}>{formatVND(totalUnpaid)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{invoicesList.filter(i => i.status === 'UNPAID').length} hóa đơn chờ thanh toán</div>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT: Credit Limit Settings + Payment Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
        
        {/* CREDIT LIMIT ADJUSTMENT */}
        <div className="card-box">
          <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-sliders"></i> Điều Chỉnh Hạn Mức Tín Dụng
          </h4>
          <form onSubmit={handleUpdateCreditLimit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-gold)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-brand)' }}>Hạn Mức Mới (VNĐ)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Nhập hạn mức mới, ví dụ: 1500000000"
                value={newLimitInput}
                onChange={e => setNewLimitInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-redapron-gold" style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
              <i className="fa-solid fa-check"></i> Cập Nhật
            </button>
          </form>

          {/* AUTO-LOCK RULES */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '16px' }}>
            <h5 style={{ fontSize: '0.8rem', color: '#B25E00', marginBottom: '10px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i> Quy Tắc Tự Động Khóa
            </h5>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: '1.8', margin: 0 }}>
              <li>Khóa Net-30 khi dư nợ vượt ≥100% hạn mức</li>
              <li>Chuyển Pre-payment nếu quá hạn &gt; 30 ngày</li>
              <li>Email cảnh báo trước 5 ngày đến hạn</li>
            </ul>
          </div>
        </div>

        {/* PAYMENT STATISTICS */}
        <div className="card-box">
          <h4 style={{ fontFamily: 'var(--font-heading)', color: '#346538', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-chart-pie"></i> Thống Kê Thanh Toán
          </h4>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tổng phát hành:</span>
              <strong style={{ color: 'var(--text-main)' }}>{formatVND(totalInvoiced)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Đã thanh toán:</span>
              <strong style={{ color: '#346538' }}>{formatVND(totalPaid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chưa thanh toán:</span>
              <strong style={{ color: '#B25E00' }}>{formatVND(totalUnpaid)}</strong>
            </div>
          </div>

          {/* PAYMENT RATE BAR */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tỷ lệ thanh toán</span>
              <strong style={{ color: '#346538', fontSize: '0.9rem' }}>
                {totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%
              </strong>
            </div>
            <div style={{ width: '100%', height: '10px', borderRadius: '5px', background: 'rgba(0,0,0,0.06)' }}>
              <div style={{
                width: `${totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%`,
                height: '100%',
                borderRadius: '5px',
                background: 'linear-gradient(90deg, #10B981, #34D399)',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="card-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-file-invoice gold-text"></i> Danh Sách Hóa Đơn (Invoices)
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'UNPAID', 'PAID'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  background: filterStatus === status ? 'var(--accent-burgundy)' : '#1A1315',
                  color: filterStatus === status ? '#FFF' : 'var(--text-muted)',
                  border: filterStatus === status ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-brand)',
                  letterSpacing: '0.5px'
                }}
              >
                {status === 'ALL' ? 'Tất Cả' : status === 'PAID' ? 'Đã TT' : 'Chưa TT'}
              </button>
            ))}
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>MÃ HÓA ĐƠN</th>
              <th>MÃ ĐƠN HÀNG</th>
              <th>NGÀY PHÁT HÀNH</th>
              <th>NGÀY ĐẾN HẠN</th>
              <th>GIÁ TRỊ (VNĐ)</th>
              <th>TRẠNG THÁI</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(inv => (
              <tr key={inv.invoice_id}>
                <td><strong>{inv.invoice_number}</strong></td>
                <td><code style={{ color: 'var(--text-muted)' }}>{inv.order_number}</code></td>
                <td>{inv.issue_date || '—'}</td>
                <td>
                  {inv.due_date}
                  {inv.status === 'UNPAID' && new Date(inv.due_date) < new Date() && (
                    <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '2px' }}>
                      <i className="fa-solid fa-triangle-exclamation"></i> Quá hạn
                    </div>
                  )}
                </td>
                <td className="gold-text"><strong>{formatVND(inv.amount)}</strong></td>
                <td>
                  {inv.status === 'PAID' ? (
                    <span style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      Đã Thanh Toán
                    </span>
                  ) : (
                    <span style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      Chờ Thanh Toán
                    </span>
                  )}
                </td>
                <td>
                  {inv.status !== 'PAID' && (
                    <button
                      className="btn-redapron-gold"
                      style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      onClick={() => handlePayInvoice(inv.invoice_id)}
                    >
                      <i className="fa-solid fa-money-bill-wave"></i> Thanh Toán
                    </button>
                  )}
                  {inv.status === 'PAID' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã hoàn tất</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LETTER OF CREDIT (L/C) APPROVAL PANEL */}
      <div className="card-box" style={{ marginTop: '25px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-file-shield gold-text"></i> Duyệt Thư Tín Dụng L/C (Chief Accountant Mode)
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Thẩm định tài liệu bảo lãnh L/C của khách hàng B2B. Việc phê duyệt sẽ tự động cộng hạn mức L/C vào Hạn Mức Tín Dụng Net-30 hiện tại của doanh nghiệp.
        </p>

        <table className="data-table">
          <thead>
            <tr>
              <th>MÃ L/C</th>
              <th>DOANH NGHIỆP</th>
              <th>NGÂN HÀNG PHÁT HÀNH</th>
              <th>GIÁ TRỊ BẢO LÃNH (VNĐ)</th>
              <th>NGÀY HẾT HẠN</th>
              <th>TRẠNG THÁI</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {lcDocs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  Không có yêu cầu L/C nào cần phê duyệt.
                </td>
              </tr>
            ) : (
              lcDocs.map(doc => {
                let statusColor = '#F59E0B';
                let statusBg = 'rgba(245,158,11,0.1)';
                let statusText = 'Chờ Duyệt';
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
                    <td>{doc.buyer_company}</td>
                    <td>{doc.issuing_bank}</td>
                    <td className="gold-text"><strong>{formatVND(doc.amount)}</strong></td>
                    <td>{doc.expiry_date}</td>
                    <td>
                      <span style={{ color: statusColor, background: statusBg, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '500' }}>
                        {statusText}
                      </span>
                    </td>
                    <td>
                      {doc.status === 'SUBMITTED' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-redapron-gold"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#111111', color: '#FFFFFF', border: '1px solid #111111' }}
                            onClick={() => handleVerifyLc(doc.lc_id)}
                          >
                            <i className="fa-solid fa-check"></i> Duyệt L/C
                          </button>
                          <button
                            className="btn-redapron-gold"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'transparent', color: '#EF4444', border: '1px solid #EF4444' }}
                            onClick={() => handleRejectLc(doc.lc_id)}
                          >
                            <i className="fa-solid fa-xmark"></i> Từ Chối
                          </button>
                        </div>
                      ) : doc.status === 'VERIFIED' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <i className="fa-solid fa-circle-check" style={{ color: '#10B981', marginRight: '4px' }}></i> Hạn mức tăng +{formatVND(doc.amount)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <i className="fa-solid fa-circle-xmark" style={{ color: '#EF4444', marginRight: '4px' }}></i> Đã từ chối bảo lãnh
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
