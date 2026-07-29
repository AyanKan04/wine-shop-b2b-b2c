import React, { useState } from 'react';
import { formatVND } from '../utils/formatters.js';

export default function OrdersCreditPage({ orders, credit, invoices, showToast }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'invoices' | 'credit'
  const [invoiceList, setInvoiceList] = useState(invoices || []);
  const [creditState, setCreditState] = useState(credit || { total_limit: 0, used_amount: 0, available_balance: 0 });

  const [ordersList] = useState([
    {
      order_id: 501, order_number: 'ORD-2026-8821',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      items: [
        { product_name: 'Macallan 18 Year Old Sherry Oak Single Malt', quantity: 20, unit_price: 68000000 }
      ],
      total_amount: 1360000000,
      order_status: 'DELIVERED',
      payment_status: 'PAID',
      created_at: '2026-07-10',
      delivered_at: '2026-07-15'
    },
    {
      order_id: 502, order_number: 'ORD-2026-8842',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      items: [
        { product_name: 'Château Margaux Premier Grand Cru Classé 2018', quantity: 15, unit_price: 98000000 }
      ],
      total_amount: 1470000000,
      order_status: 'PROCESSING',
      payment_status: 'UNPAID',
      created_at: '2026-07-20',
      delivered_at: null
    },
    ...(orders || []).filter(o => o.order_id !== 501 && o.order_id !== 502)
  ]);

  const handlePayInvoice = (invoiceId) => {
    const inv = invoiceList.find(i => i.invoice_id === invoiceId);
    if (!inv) return;

    setInvoiceList(prev => prev.map(i => i.invoice_id === invoiceId ? { ...i, status: 'PAID' } : i));
    setCreditState(prev => ({
      ...prev,
      used_amount: Math.max(0, prev.used_amount - inv.amount),
      available_balance: prev.available_balance + inv.amount
    }));
    showToast(`Đã thanh toán hóa đơn ${inv.invoice_number} thành công! Hạn mức khả dụng đã được khôi phục.`);
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
            {invoiceList.filter(i => i.status === 'UNPAID').length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {formatVND(invoiceList.filter(i => i.status === 'UNPAID').reduce((s, i) => s + i.amount, 0))} tổng giá trị
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-gold)', marginBottom: '25px', gap: '5px' }}>
        {[
          { id: 'orders', label: 'Đơn Hàng', icon: 'fa-boxes-stacked' },
          { id: 'invoices', label: 'Hóa Đơn & Thanh Toán', icon: 'fa-receipt' },
          { id: 'credit', label: 'Chi Tiết Hạn Mức', icon: 'fa-credit-card' }
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
              {ordersList.map(order => {
                const sc = statusConfig[order.order_status] || statusConfig.PROCESSING;
                return (
                  <tr key={order.order_id}>
                    <td><code style={{ color: 'var(--accent-gold)' }}>{order.order_number}</code></td>
                    <td>{order.created_at}</td>
                    <td>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', color: '#FFF' }}>
                          {item.product_name}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Đơn giá: {formatVND(item.unit_price)}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td><strong>{order.items.reduce((s, i) => s + i.quantity, 0)}</strong> thùng</td>
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
              {invoiceList.map(inv => {
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
                { label: 'Loại hạn mức', value: 'Net-30 (Trả sau 30 ngày)', color: '#FFF' },
                { label: 'Tổng hạn mức được duyệt', value: formatVND(creditState.total_limit), color: 'var(--accent-gold)' },
                { label: 'Dư nợ đang sử dụng', value: formatVND(creditState.used_amount), color: '#F59E0B' },
                { label: 'Số dư khả dụng còn lại', value: formatVND(creditState.available_balance), color: '#10B981' },
                { label: 'Tỷ lệ sử dụng', value: `${usedPercent}%`, color: creditWarning ? '#EF4444' : '#FFF' }
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
              <li>Tự động chuyển sang <strong style={{ color: '#FFF' }}>Pre-payment (Trả trước)</strong> nếu có hóa đơn quá hạn 30 ngày.</li>
              <li>Gửi cảnh báo Email tự động <strong style={{ color: '#F59E0B' }}>trước 5 ngày</strong> đến hạn thanh toán.</li>
              <li>Hạn mức tín dụng sẽ được khôi phục ngay lập tức khi thanh toán hóa đơn.</li>
              <li>Yêu cầu Giấy phép Rượu hợp lệ theo NĐ 105/2017/NĐ-CP để kích hoạt.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
