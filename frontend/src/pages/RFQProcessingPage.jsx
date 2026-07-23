import React from 'react';
import { formatVND } from '../utils/formatters.js';

export default function RFQProcessingPage({ rfqs, showToast }) {
  return (
    <div className="page-container">
      <h2 className="page-title burgundy-text">9. SALES PROCESSING: TIẾP NHẬN & PHÁT HÀNH BÁO GIÁ QUOTATION</h2>
      <p className="page-subtitle">Tính toán biên lợi nhuận và phát hành Báo giá chính thức cho Yêu cầu RFQ của khách hàng</p>

      <div className="card-box">
        <table className="data-table">
          <thead>
            <tr><th>MÃ RFQ</th><th>KHÁCH HÀNG MUA</th><th>SẢN PHẨM</th><th>SL THÙNG</th><th>GIÁ KHÁCH ĐỀ XUẤT</th><th>HÀNH ĐỘNG SALES</th></tr>
          </thead>
          <tbody>
            {rfqs.map(r => (
              <tr key={r.rfq_id}>
                <td>#RFQ-{r.rfq_id}</td>
                <td>{r.buyer_company}</td>
                <td>{r.product_name}</td>
                <td>{r.quantity} thùng</td>
                <td className="gold-text">{formatVND(r.target_price)}</td>
                <td>
                  <button className="btn-redapron-gold" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => showToast(`Đã phát hành Báo giá Quotation cho RFQ #${r.rfq_id}!`)}>Phát Hành Quotation</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
