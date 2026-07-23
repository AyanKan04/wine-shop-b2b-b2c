import React from 'react';
import { formatVND } from '../utils/formatters.js';

export default function RFQManagementPage({ rfqs, quotations, showToast }) {
  return (
    <div className="page-container">
      <h2 className="page-title">5. QUẢN LÝ YÊU CẦU BÁO GIÁ (RFQ MANAGEMENT)</h2>
      <p className="page-subtitle">Theo dõi trạng thái RFQ đã gửi và phản hồi Báo giá (Quotation) từ bên Bán</p>

      <div className="card-box">
        <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>DANH SÁCH RFQ ĐÃ GỬI</h4>
        <table className="data-table">
          <thead>
            <tr><th>MÃ RFQ</th><th>TÊN SẢN PHẨM</th><th>SỐ LƯỢNG</th><th>GIÁ ĐỀ XUẤT</th><th>TRẠNG THÁI</th></tr>
          </thead>
          <tbody>
            {rfqs.map(r => (
              <tr key={r.rfq_id}>
                <td>#RFQ-{r.rfq_id}</td>
                <td>{r.product_name}</td>
                <td>{r.quantity} thùng</td>
                <td className="gold-text">{formatVND(r.target_price)}</td>
                <td><span style={{ color: '#F9B115', border: '1px solid #F9B115', padding: '2px 8px', borderRadius: '3px', fontSize: '0.7rem' }}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-box">
        <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>BẢNG BÁO GIÁ (QUOTATION) NHẬN TỪ SALES REPRESENTATIVE</h4>
        <table className="data-table">
          <thead>
            <tr><th>MÃ QUOTATION</th><th>ĐƠN GIÁ SALES ĐỀ XUẤT</th><th>SỐ LƯỢNG</th><th>HẠN HIỆU LỰC</th><th>HÀNH ĐỘNG</th></tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.quotation_id}>
                <td>#QUOT-{q.quotation_id}</td>
                <td className="gold-text"><strong>{formatVND(q.offer_unit_price)}</strong></td>
                <td>{q.quantity} thùng</td>
                <td>{q.valid_until}</td>
                <td>
                  <button className="btn-redapron-gold" style={{ padding: '4px 10px', fontSize: '0.7rem', marginRight: '8px' }} onClick={() => showToast('Đã CHẤP NHẬN Báo giá! Đơn hàng đang được khởi tạo.')}>Chấp Nhận</button>
                  <button className="btn-redapron-burgundy" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => showToast('Đã Từ Chối Báo giá.')}>Từ Chối</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
