import React, { useState, useEffect } from 'react';
import { formatVND } from '../utils/formatters.js';
import apiService from '../services/api.js';

export default function OrdersCreditPage({ orders, credit, invoices, showToast }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'invoices' | 'credit' | 'lc'
  const [invoiceList, setInvoiceList] = useState(invoices || []);
  const [creditState, setCreditState] = useState(credit || { total_limit: 0, used_amount: 0, available_balance: 0 });
  
  // Payment Collection Modal State (Swimlane 1: Finance Officer Collection Form)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // L/C Documents
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

      if (lcRes.success && lcRes.data) setLcDocs(lcRes.data);
      if (ordersRes.success && ordersRes.data) setOrdersList(ordersRes.data);
      
      if (creditRes.success) {
        if (creditRes.credit) setCreditState(creditRes.credit);
        if (creditRes.invoices) setInvoiceList(creditRes.invoices);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      if (showToast) showToast('Lỗi tải dữ liệu Đơn hàng & Công nợ');
    } finally {
      setLoading(false);
    }
  };

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
      showToast('Vui lòng nhập số tiền thu thực tế hợp lệ lớn hơn 0.');
      return;
    }

    if (val > remaining) {
      showToast(`Số tiền thu (${val.toLocaleString()} đ) không được lớn hơn dư nợ còn lại (${remaining.toLocaleString()} đ).`);
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
        showToast(res.message || 'Ghi nhận thanh toán thành công!');
        setShowPaymentModal(false);

        // Optimistic state update for instant UI feedback
        setInvoiceList(prev => prev.map(inv => {
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

        setCreditState(prev => ({
          ...prev,
          used_amount: (prev.used_amount - val < 0) ? 0 : (prev.used_amount - val),
          available_balance: (prev.available_balance + val > prev.total_limit) ? prev.total_limit : (prev.available_balance + val)
        }));

        setSelectedInvoice(null);
        fetchData(); // Refresh from backend
      } else {
        showToast(res.message || 'Thanh toán thất bại');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi ghi nhận thanh toán hóa đơn');
    } finally {
      setSubmittingPay(false);
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
        setLcNumber(''); setLcBank(''); setLcAmount(''); setLcExpiry('');
        fetchData();
      }
    } catch (err) {
      showToast('Lỗi khi gửi tài liệu L/C. Vui lòng thử lại.');
    } finally {
      setLoadingLc(false);
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
      {loading && <div style={{ color: 'var(--text-main)', padding: '10px' }}>Đang tải dữ liệu công nợ...</div>}
      
      {/* HEADER */}
      <div style={{ marginBottom: '25px' }}>
        <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          <i className="fa-solid fa-file-invoice-dollar gold-text"></i> Quản Lý Đơn Hàng & Công Nợ Doanh Nghiệp (Net-30)
        </h2>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Theo dõi hạn mức tín dụng, thu tiền hóa đơn từng phần/toàn phần, ghi nhận dòng tiền và lịch sử giao dịch.
        </p>
      </div>

      {/* CREDIT LIMIT OVERVIEW (Hiển thị Dashboard Công nợ Doanh nghiệp) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng Hạn Mức Tín Dụng</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-gold)', marginTop: '6px' }}>{formatVND(creditState.total_limit)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>Phương thức: Net-30 Credit</div>
        </div>
        
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${creditWarning ? 'rgba(239,68,68,0.5)' : 'var(--border-gold)'}`, borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Công Nợ Đang Sử Dụng (Used)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: creditWarning ? '#EF4444' : '#F59E0B', marginTop: '6px' }}>{formatVND(creditState.used_amount)}</div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', marginTop: '8px' }}>
            <div style={{ width: `${Math.min(100, usedPercent)}%`, height: '100%', borderRadius: '3px', background: creditWarning ? '#DC2626' : '#D97706', transition: 'width 0.5s ease' }}></div>
          </div>
          <div style={{ fontSize: '0.7rem', color: creditWarning ? '#DC2626' : 'var(--text-muted)', marginTop: '4px' }}>
            {usedPercent}% hạn mức đã sử dụng {creditWarning && <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: '4px' }}></i>}
          </div>
        </div>
        
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hạn Mức Khả Dụng Còn Lại</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#10B981', marginTop: '6px' }}>{formatVND(creditState.available_balance)}</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '3px' }}>Khôi phục tự động khi thu tiền</div>
        </div>
        
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hóa Đơn Còn Nợ (Unpaid)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#8B5CF6', marginTop: '6px' }}>
            {(invoiceList || []).filter(i => i.status !== 'PAID').length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {formatVND((invoiceList || []).filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.remaining_amount !== undefined ? i.remaining_amount : i.amount), 0))} tổng dư nợ
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-gold)', marginBottom: '25px', gap: '5px' }}>
        {[
          { id: 'orders', label: 'Đơn Hàng Sỉ', icon: 'fa-boxes-stacked' },
          { id: 'invoices', label: 'Hóa Đơn & Thu Tiền Công Nợ', icon: 'fa-receipt' },
          { id: 'credit', label: 'Chi Tiết Hạn Mức Tín Dụng', icon: 'fa-credit-card' },
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
            <i className="fa-solid fa-boxes-stacked gold-text"></i> Lịch Sử Đơn Hàng Sỉ Doanh Nghiệp
          </h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ ĐƠN HÀNG</th>
                <th>NGÀY ĐẶT</th>
                <th>ĐỐI TÁC B2B</th>
                <th>SỐ LƯỢNG</th>
                <th>TỔNG GIÁ TRỊ</th>
                <th>TRẠNG THÁI ĐƠN</th>
                <th>THANH TOÁN</th>
              </tr>
            </thead>
            <tbody>
              {(ordersList || []).map(order => {
                const sc = statusConfig[order.order_status] || statusConfig.PROCESSING;
                return (
                  <tr key={order.order_id}>
                    <td><code style={{ color: 'var(--accent-gold)' }}>{order.order_number}</code></td>
                    <td>{order.created_at}</td>
                    <td style={{ fontWeight: '600' }}>{order.buyer_company || 'Lotte Mart VN'}</td>
                    <td><strong>{order.items ? order.items.reduce((s, i) => s + i.quantity, 0) : 12}</strong> thùng</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{formatVND(order.total_amount)}</td>
                    <td>
                      <span style={{ color: sc.color, background: sc.bg, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: order.payment_status === 'PAID' ? '#10B981' : order.payment_status === 'PARTIALLY_PAID' ? '#F59E0B' : '#EF4444',
                        fontSize: '0.75rem', fontWeight: '600'
                      }}>
                        {order.payment_status === 'PAID' ? 'Đã Thanh Toán' : order.payment_status === 'PARTIALLY_PAID' ? 'Thanh Toán 1 Phần' : 'Chưa Thanh Toán'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: INVOICES (Finance Officer Collection Flow) */}
      {activeTab === 'invoices' && (
        <div className="card-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-receipt gold-text"></i> Danh Sách Hóa Đơn & Ghi Nhận Thu Tiền Công Nợ
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Nhấp nút "Thu Tiền Hóa Đơn" để ghi nhận dòng tiền thực tế và khôi phục hạn mức tín dụng.
            </span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ HÓA ĐƠN</th>
                <th>ĐỐI TÁC B2B</th>
                <th>MÃ ĐƠN HÀNG</th>
                <th>NGÀY HẠN</th>
                <th>TỔNG NỢ (VNĐ)</th>
                <th>ĐÃ THU (VNĐ)</th>
                <th>CÒN NỢ (VNĐ)</th>
                <th>TRẠNG THÁI</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {(invoiceList || []).map(inv => {
                const totalAmt = inv.amount || 0;
                const paidAmt = inv.paid_amount || 0;
                const remAmt = inv.remaining_amount !== undefined ? inv.remaining_amount : (totalAmt - paidAmt > 0 ? totalAmt - paidAmt : 0);
                const isOverdue = inv.status !== 'PAID' && new Date(inv.due_date) < new Date();

                return (
                  <tr key={inv.invoice_id}>
                    <td><code style={{ color: 'var(--accent-gold)' }}>{inv.invoice_number}</code></td>
                    <td style={{ fontWeight: '600' }}>{inv.buyer_company || 'Doanh Nghiệp B2B'}</td>
                    <td><code>{inv.order_number}</code></td>
                    <td>
                      {inv.due_date}
                      {isOverdue && (
                        <div style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: '700' }}>Quá hạn!</div>
                      )}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{formatVND(totalAmt)}</td>
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
                          {isOverdue ? 'Quá Hạn' : 'Chưa Thanh Toán'}
                        </span>
                      )}
                    </td>
                    <td>
                      {inv.status !== 'PAID' && remAmt > 0 ? (
                        <button className="btn-redapron-gold" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleOpenPaymentModal(inv)}>
                          <i className="fa-solid fa-hand-holding-dollar"></i> Thu Tiền Hóa Đơn
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
      )}

      {/* MODAL THU TIỀN HÓA ĐƠN (Swimlane 1: Finance Officer Collection Modal) */}
      {showPaymentModal && selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', border: '2px solid #D4AF37', borderRadius: '10px', padding: '30px', maxWidth: '600px', width: '100%', color: '#1A1A1A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #F3F4F6', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ marginTop: 0, color: '#721C24', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                  <i className="fa-solid fa-receipt" style={{ marginRight: '8px' }}></i> Ghi Nhận Thu Tiền Hóa Đơn - {selectedInvoice.invoice_number}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  Thực hiện ghi nhận dòng tiền thực tế (INSERT Payments & UPDATE CreditLimits).
                </span>
              </div>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ marginTop: '20px' }}>
              {/* SUMMARY INFO */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                <div><strong>Đối tác B2B:</strong> {selectedInvoice.buyer_company || 'Lotte Mart VN'}</div>
                <div><strong>Mã đơn hàng:</strong> <code>{selectedInvoice.order_number}</code></div>
                <div><strong>Tổng tiền hóa đơn:</strong> <span style={{ color: '#111827', fontWeight: '700' }}>{formatVND(selectedInvoice.amount)}</span></div>
                <div><strong>Dư nợ còn lại:</strong> <span style={{ color: '#DC2626', fontWeight: '700' }}>{formatVND(selectedInvoice.remaining_amount !== undefined ? selectedInvoice.remaining_amount : selectedInvoice.amount)}</span></div>
              </div>

              {/* INPUT 1: SỐ TIỀN THU THỰC TẾ (Swimlane 1: Nhập số tiền) */}
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

              {/* INPUT 2: PHƯƠNG THỨC THANH TOÁN (Swimlane 1: Chọn phương thức thanh toán) */}
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

              {/* INPUT 3: MÃ GIAO DỊCH / GHI CHÚ */}
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

              {/* ACTION BUTTONS (Swimlane 1: Bấm "Xác nhận thanh toán") */}
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

      {/* TAB 3: CREDIT DETAILS */}
      {activeTab === 'credit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card-box">
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px' }}>
              <i className="fa-solid fa-info-circle gold-text"></i> Thông Tin Hạn Mức Tín Dụng Doanh Nghiệp
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
          <div className="card-box">
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-file-invoice-dollar gold-text"></i> Nộp Thư Tín Dụng L/C
            </h4>
            <form onSubmit={handleSubmitLc}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Số Thư Tín Dụng (L/C Number) *</label>
                <input className="form-control" required value={lcNumber} onChange={e=>setLcNumber(e.target.value)} placeholder="Ví dụ: LC-2026-VCB-9988" />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Ngân Hàng Phát Hành *</label>
                <input className="form-control" required value={lcBank} onChange={e=>setLcBank(e.target.value)} placeholder="Ví dụ: Vietcombank - Chi nhánh TP.HCM" />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Giá Trị Bảo Lãnh (VNĐ) *</label>
                <input type="number" className="form-control" required value={lcAmount} onChange={e=>setLcAmount(e.target.value)} placeholder="Ví dụ: 500000000" />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Ngày Hết Hạn *</label>
                <input type="date" className="form-control" required value={lcExpiry} onChange={e=>setLcExpiry(e.target.value)} />
              </div>
              <button type="submit" className="btn-redapron-gold" style={{ width: '100%' }} disabled={loadingLc}>
                {loadingLc ? 'Đang Gửi...' : 'Nộp Thư Tín Dụng L/C'}
              </button>
            </form>
          </div>

          <div className="card-box">
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-list-check gold-text"></i> Danh Sách Thư Tín Dụng Đã Nộp
            </h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SỐ L/C</th>
                  <th>NGÂN HÀNG</th>
                  <th>GIÁ TRỊ</th>
                  <th>HẠN BẢO LÃNH</th>
                  <th>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {(lcDocs || []).map(doc => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
