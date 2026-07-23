import React from 'react';

export default function FinanceMgmtPage({ showToast }) {
  return (
    <div className="page-container">
      <h2 className="page-title burgundy-text">10. FINANCE OFFICER: QUẢN LÝ CÔNG NỢ & XUẤT HÓA ĐƠN INVOICE</h2>
      <p className="page-subtitle">Cấp Hạn mức Tín dụng cho từng đối tác mua và theo dõi quá trình quyết toán</p>

      <div className="card-box">
        <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>THIẾT LẬP HẠN MỨC TÍN DỤNG (CREDIT LIMIT SETTING)</h4>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <input className="form-control" defaultValue="1,500,000,000 VNĐ" style={{ maxWidth: '300px' }} />
          <button className="btn-redapron-gold" onClick={() => showToast('Đã cập nhật Hạn mức Tín dụng mới cho Doanh nghiệp!')}>Cập Nhật Hạn Mức Tín Dụng</button>
        </div>
      </div>
    </div>
  );
}
