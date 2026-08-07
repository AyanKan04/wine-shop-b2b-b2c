import React, { useState, useEffect } from 'react';
import apiService from '../services/api.js';

export default function FinanceMgmtPage({ credit, invoices, showToast }) {
  const [creditData, setCreditData] = useState(credit || { total_limit: 1000000000, used_amount: 0, available_balance: 1000000000 });
  const [invoicesList, setInvoicesList] = useState(invoices || []);
  const [newLimitInput, setNewLimitInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [lcDocs, setLcDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Payment Collection Modal State (Swimlane 1: Finance Officer Collection Form)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  useEffect(() => {
    fetchData();
    fetchLcDocs();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiService.getCreditLimit();
      if (res.success) {
        if (res.credit) setCreditData(res.credit);
        if (res.invoices) setInvoicesList(res.invoices);
      }
    } catch (err) {
      console.error('Error fetching finance data:', err);
      if (showToast) showToast('Lỗi tải dữ liệu công nợ từ server');
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

  const handleVerifyLc = async (lcId) => {
    try {
      const res = await apiService.verifyLCDocument(lcId);
      if (res.success) {
        if (showToast) showToast(res.message || 'Phê duyệt Thư tín dụng L/C thành công!');
        fetchLcDocs();
        fetchData();
      }
    } catch (err) {
      if (showToast) showToast('Lỗi khi phê duyệt tài liệu L/C.');
    }
  };

  const handleRejectLc = async (lcId) => {
    try {
      const res = await apiService.rejectLCDocument(lcId);
      if (res.success) {
        if (showToast) showToast(res.message || 'Đã từ chối Thư tín dụng L/C.');
        fetchLcDocs();
      }
    } catch (err) {
      if (showToast) showToast('Lỗi khi từ chối tài liệu L/C.');
    }
  };

  const formatVND = (val) => {
    if (!val) return '0 ₫';
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ ₫';
    if (val >= 1000000) return (val / 1000000).toFixed(0) + ' Tr ₫';
    return Number(val).toLocaleString('vi-VN') + ' ₫';
  };

  const usagePercent = creditData.total_limit > 0 ? Math.round((creditData.used_amount / creditData.total_limit) * 100) : 0;

  // Open modal for invoice collection
  const handleOpenPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    const rem = inv.remaining_amount !== undefined ? inv.remaining_amount : (inv.amount - (inv.paid_amount || 0));
    setPayAmount(rem > 0 ? rem : inv.amount);
    setPayMethod('BANK_TRANSFER');
    setPayRef(`FT${Date.now().toString().slice(-8)}`);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const val = Number(payAmount);
    const remaining = selectedInvoice.remaining_amount !== undefined ? selectedInvoice.remaining_amount : selectedInvoice.amount;

    if (isNaN(val) || val <= 0) {
      if (showToast) showToast('Vui lòng nhập số tiền thu thực tế hợp lệ lớn hơn 0.');
      return;
    }

    if (val > remaining) {
      if (showToast) showToast(`Số tiền thu (${val.toLocaleString()} đ) không được lớn hơn dư nợ còn lại (${remaining.toLocaleString()} đ).`);
      return;
    }

    setSubmittingPay(true);
    try {
      const res = await apiService.payInvoice(selectedInvoice.invoice_id, {
        paid_amount: val,
        payment_method: payMethod,
        payment_reference: payRef
      });

      if (res.success) {
        if (showToast) showToast(res.message || 'Ghi nhận thanh toán thành công!');
        setShowPaymentModal(false);

        // Optimistic UI state update so invoice list and payment totals update immediately on screen
        setInvoicesList(prev => prev.map(inv => {
          if (inv.invoice_id === selectedInvoice.invoice_id) {
            const newPaid = (inv.paid_amount || 0) + val;
            const newRem = inv.amount - newPaid > 0 ? inv.amount - newPaid : 0;
            return {
              ...inv,
              paid_amount: newPaid,
              remaining_amount: newRem,
              status: newRem === 0 ? 'PAID' : 'PARTIALLY_PAID'
            };
          }
          return inv;
        }));

        setCreditData(prev => ({
          ...prev,
          used_amount: (prev.used_amount - val < 0) ? 0 : (prev.used_amount - val),
          available_balance: (prev.available_balance + val > prev.total_limit) ? prev.total_limit : (prev.available_balance + val)
        }));

        setSelectedInvoice(null);
        fetchData(); // Refresh from backend
      } else {
        if (showToast) showToast(res.message || 'Thanh toán thất bại');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Lỗi khi ghi nhận thanh toán hóa đơn');
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleUpdateCreditLimit = async (e) => {
    e.preventDefault();
    const val = parseFloat(newLimitInput);
    if (!val || val <= 0) {
      if (showToast) showToast('Vui lòng nhập hạn mức hợp lệ (số > 0)');
      return;
    }
    setCreditData(prev => ({
      ...prev,
      total_limit: val,
      available_balance: val - prev.used_amount
    }));
    if (showToast) showToast(`Đã cập nhật hạn mức tín dụng mới: ${formatVND(val)}`);
    setNewLimitInput('');
  };

  const filteredInvoices = invoicesList.filter(inv => {
    if (filterStatus === 'ALL') return true;
    return inv.status === filterStatus;
  });

  const totalInvoiced = invoicesList.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = invoicesList.reduce((sum, inv) => sum + (inv.paid_amount || (inv.status === 'PAID' ? inv.amount : 0)), 0);
  const totalUnpaid = invoicesList.reduce((sum, inv) => sum + (inv.remaining_amount !== undefined ? inv.remaining_amount : (inv.status !== 'PAID' ? inv.amount : 0)), 0);

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <i className="fa-solid fa-scale-balanced gold-text"></i> Quản Lý Công Nợ & Kế Toán (Finance Officer Suite)
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Giám sát hạn mức tín dụng Net-30, thu tiền hóa đơn từng phần/toàn phần, ghi nhận dòng tiền theo Activity Diagram.
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Dư Nợ Chưa Thu</span>
            <i className="fa-solid fa-file-invoice" style={{ color: '#F59E0B' }}></i>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#F59E0B', marginTop: '8px' }}>{formatVND(totalUnpaid)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{invoicesList.filter(i => i.status !== 'PAID').length} hóa đơn chờ thu tiền</div>
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
            <i className="fa-solid fa-chart-pie"></i> Thống Kê Thanh Toán & Dòng Tiền
          </h4>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tổng phát hành:</span>
              <strong style={{ color: 'var(--text-main)' }}>{formatVND(totalInvoiced)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Đã thu tiền:</span>
              <strong style={{ color: '#346538' }}>{formatVND(totalPaid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chưa thu (Còn nợ):</span>
              <strong style={{ color: '#B25E00' }}>{formatVND(totalUnpaid)}</strong>
            </div>
          </div>

          {/* PAYMENT RATE BAR */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tỷ lệ thu hồi nợ</span>
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

      {/* INVOICES TABLE (Finance Officer Collection Table) */}
      <div className="card-box" style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-file-invoice gold-text"></i> Danh Sách Hóa Đơn & Thu Tiền (Invoices & Collection)
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map(status => (
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
                {status === 'ALL' ? 'Tất Cả' : status === 'PAID' ? 'Đã TT' : status === 'PARTIALLY_PAID' ? 'Trả 1 Phần' : 'Chưa TT'}
              </button>
            ))}
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>MÃ HÓA ĐƠN</th>
              <th>ĐỐI TÁC B2B</th>
              <th>MÃ ĐƠN HÀNG</th>
              <th>NGÀY ĐẾN HẠN</th>
              <th>TỔNG NỢ</th>
              <th>ĐÃ THU</th>
              <th>CÒN NỢ</th>
              <th>TRẠNG THÁI</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Đang tải hóa đơn...</td></tr> :
            filteredInvoices.map(inv => {
              const totalAmt = inv.amount || 0;
              const paidAmt = inv.paid_amount || 0;
              const remAmt = inv.remaining_amount !== undefined ? inv.remaining_amount : (totalAmt - paidAmt > 0 ? totalAmt - paidAmt : 0);
              const isOverdue = inv.status !== 'PAID' && new Date(inv.due_date) < new Date();

              return (
                <tr key={inv.invoice_id}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td style={{ fontWeight: '600' }}>{inv.buyer_company || 'Doanh Nghiệp B2B'}</td>
                  <td><code style={{ color: 'var(--text-muted)' }}>{inv.order_number}</code></td>
                  <td>
                    {inv.due_date}
                    {isOverdue && (
                      <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '2px' }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> Quá hạn
                      </div>
                    )}
                  </td>
                  <td className="gold-text"><strong>{formatVND(totalAmt)}</strong></td>
                  <td style={{ color: '#10B981', fontWeight: '600' }}>{formatVND(paidAmt)}</td>
                  <td style={{ color: '#EF4444', fontWeight: '700' }}>{formatVND(remAmt)}</td>
                  <td>
                    {inv.status === 'PAID' ? (
                      <span style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                        <i className="fa-solid fa-check"></i> Đã Thanh Toán
                      </span>
                    ) : inv.status === 'PARTIALLY_PAID' ? (
                      <span style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                        <i className="fa-solid fa-bolt"></i> Trả 1 Phần
                      </span>
                    ) : (
                      <span style={{ color: isOverdue ? '#EF4444' : '#6B7280', background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                        {isOverdue ? 'Quá Hạn' : 'Chờ Thanh Toán'}
                      </span>
                    )}
                  </td>
                  <td>
                    {inv.status !== 'PAID' && remAmt > 0 ? (
                      <button className="btn-redapron-gold" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleOpenPaymentModal(inv)}>
                        <i className="fa-solid fa-hand-holding-dollar"></i> Thu Tiền
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>Hoàn Tất</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* L/C VERIFICATION SECTION */}
      <div className="card-box">
        <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-file-shield"></i> Thẩm Định Thư Tín Dụng (L/C Verification)
        </h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>MÃ L/C</th>
              <th>NGÂN HÀNG PHÁT HÀNH</th>
              <th>GIÁ TRỊ (VNĐ)</th>
              <th>HẠN BẢO LÃNH</th>
              <th>TRẠNG THÁI</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {lcDocs.map(doc => (
              <tr key={doc.lc_id}>
                <td><code>{doc.lc_number}</code></td>
                <td>{doc.issuing_bank}</td>
                <td style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{formatVND(doc.amount)}</td>
                <td>{doc.expiry_date}</td>
                <td>
                  <span style={{
                    color: doc.status === 'VERIFIED' ? '#10B981' : doc.status === 'REJECTED' ? '#EF4444' : '#F59E0B',
                    fontSize: '0.75rem', fontWeight: '600'
                  }}>
                    {doc.status === 'VERIFIED' ? 'Đã Xác Thực' : doc.status === 'REJECTED' ? 'Từ Chối' : 'Chờ Duyệt'}
                  </span>
                </td>
                <td>
                  {doc.status === 'SUBMITTED' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleVerifyLc(doc.lc_id)} style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                        Phê Duyệt
                      </button>
                      <button onClick={() => handleRejectLc(doc.lc_id)} style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                        Từ Chối
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL THU TIỀN HÓA ĐƠN */}
      {showPaymentModal && selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', border: '2px solid #D4AF37', borderRadius: '10px', padding: '30px', maxWidth: '600px', width: '100%', color: '#1A1A1A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #F3F4F6', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ marginTop: 0, color: '#721C24', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                  <i className="fa-solid fa-receipt" style={{ marginRight: '8px' }}></i> Ghi Nhận Thu Tiền Hóa Đơn - {selectedInvoice.invoice_number}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  Thực hiện ghi nhận dòng tiền thực tế.
                </span>
              </div>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ marginTop: '20px' }}>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                <div><strong>Đối tác B2B:</strong> {selectedInvoice.buyer_company || 'Lotte Mart VN'}</div>
                <div><strong>Mã đơn hàng:</strong> <code>{selectedInvoice.order_number}</code></div>
                <div><strong>Tổng tiền hóa đơn:</strong> <span style={{ color: '#111827', fontWeight: '700' }}>{formatVND(selectedInvoice.amount)}</span></div>
                <div><strong>Dư nợ còn lại:</strong> <span style={{ color: '#DC2626', fontWeight: '700' }}>{formatVND(selectedInvoice.remaining_amount !== undefined ? selectedInvoice.remaining_amount : selectedInvoice.amount)}</span></div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Số Tiền Thu Đợt Này (VNĐ) *</label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ fontSize: '1.1rem', fontWeight: '700', color: '#721C24' }}
                  value={payAmount ? Number(payAmount).toLocaleString('vi-VN') : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setPayAmount(raw);
                  }}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                  Có thể sửa số tiền để ghi nhận thanh toán từng phần (Partial Payment).
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Phương Thức Thanh Toán *</label>
                <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value)} required>
                  <option value="BANK_TRANSFER">Chuyển Khoản Ngân Hàng (Bank Transfer)</option>
                  <option value="CASH">Tiền Mặt (Cash)</option>
                  <option value="CREDIT_CARD">Thẻ Tín Dụng Doanh Nghiệp (Visa/Mastercard)</option>
                  <option value="LC">Thư Tín Dụng Bảo Lãnh Ngân Hàng (L/C)</option>
                  <option value="CHEQUE">Séc Ngân Hàng (Cheque)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Mã Giao Dịch / Ghi Chú Thanh Toán</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ví dụ: FT20260804001 - Chuyển khoản VCB"
                  value={payRef} 
                  onChange={e => setPayRef(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '15px', borderTop: '1px solid #E5E7EB' }}>
                <button type="button" className="btn-redapron-burgundy" onClick={() => setShowPaymentModal(false)}>Hủy Bỏ</button>
                <button type="submit" className="btn-redapron-gold" disabled={submittingPay} style={{ minWidth: '180px' }}>
                  <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i> 
                  {submittingPay ? 'Đang Xử Lý...' : 'Xác Nhận Thanh Toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
