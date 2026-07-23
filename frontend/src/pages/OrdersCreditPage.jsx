import React from 'react';
import { formatVND } from '../utils/formatters.js';

export default function OrdersCreditPage({ orders, credit, invoices, showToast }) {
  const handlePay = (invoiceId) => {
    showToast(`Đã thanh toán hóa đơn #${invoiceId} thành công! Hạn mức khả dụng đã được khôi phục.`);
  };

  return (
    <div className="page-container">
      <h2 className="page-title">6. QUẢN LÝ ĐƠN HÀNG & CÔNG NỢ (CREDIT LIMIT)</h2>
      <p className="page-subtitle">Theo dõi lịch sử đơn hàng, số dư nợ còn lại và thanh toán hóa đơn Net 30/60</p>

      <div className="card-box">
        <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>HẠN MỨC TÍN DỤNG DOANH NGHIỆP</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
          <div style={{ background: '#090708', padding: '20px', border: '1px solid var(--border-subtle)' }}>
            <div className="gold-text" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-brand)' }}>{formatVND(credit.total_limit)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng Hạn Mức Cấp</div>
          </div>
          <div style={{ background: '#090708', padding: '20px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.5rem', color: '#E54D60', fontFamily: 'var(--font-brand)' }}>{formatVND(credit.used_amount)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Công Nợ Đang Dùng</div>
          </div>
          <div style={{ background: '#090708', padding: '20px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.5rem', color: '#2EB85C', fontFamily: 'var(--font-brand)' }}>{formatVND(credit.available_balance)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Số Dư Khả Dụng Đặt Hàng</div>
          </div>
        </div>
      </div>

      <div className="card-box">
        <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>DANH SÁCH HÓA ĐƠN (INVOICES)</h4>
        <table className="data-table">
          <thead>
            <tr><th>MÃ HÓA ĐƠN</th><th>MÃ ĐƠN HÀNG</th><th>NGÀY HẠN</th><th>GIÁ TRỊ (VNĐ)</th><th>TRẠNG THÁI</th><th>HÀNH ĐỘNG</th></tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.invoice_id}>
                <td>{inv.invoice_number}</td>
                <td>{inv.order_number}</td>
                <td>{inv.due_date}</td>
                <td className="gold-text"><strong>{formatVND(inv.amount)}</strong></td>
                <td>
                  <span style={{ color: inv.status === 'PAID' ? '#2EB85C' : '#F9B115', border: `1px solid ${inv.status === 'PAID' ? '#2EB85C' : '#F9B115'}`, padding: '2px 8px', borderRadius: '3px', fontSize: '0.7rem' }}>
                    {inv.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                  </span>
                </td>
                <td>
                  {inv.status !== 'PAID' && (
                    <button className="btn-redapron-gold" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => handlePay(inv.invoice_id)}>Thanh Toán Ngay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
