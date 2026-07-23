import React from 'react';

export default function Footer() {
  return (
    <footer>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', gap: '40px', marginBottom: '40px' }}>
        <div>
          <h3 className="gold-gradient-text" style={{ fontFamily: 'var(--font-brand)', fontSize: '1.3rem', marginBottom: '15px' }}>RED APRON FINE WINES</h3>
          <p>Nhà nhập khẩu và phân phối rượu vang & đồ uống có cồn B2B cao cấp hàng đầu Việt Nam.</p>
        </div>
        <div>
          <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>KHÁCH HÀNG (BUYER)</h4>
          <p style={{ marginBottom: '6px' }}>• Catalog & Lọc Sản phẩm</p>
          <p style={{ marginBottom: '6px' }}>• Quy trình Đàm phán RFQ</p>
          <p style={{ marginBottom: '6px' }}>• Hạn mức Tín dụng Net 30</p>
        </div>
        <div>
          <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>QUẢN TRỊ (STAFF)</h4>
          <p style={{ marginBottom: '6px' }}>• Duyệt Giấy phép Rượu Admin</p>
          <p style={{ marginBottom: '6px' }}>• Cấu hình Bậc giá Tier 1-5</p>
          <p style={{ marginBottom: '6px' }}>• Xuất kho & Biên bản Giao nhận</p>
        </div>
        <div>
          <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>DỰ ÁN MÔN TMĐT</h4>
          <p style={{ marginBottom: '6px' }}>Nhóm 07 - Đồ án TMĐT</p>
          <p style={{ marginBottom: '6px' }}>GVHD: TS. Đỗ Đức Bích Ngân</p>
        </div>
      </div>
      <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
        © 2026 RedApron RuuBusiness B2B Platform. Modular ReactJS + Node.js REST API + PostgreSQL.
      </div>
    </footer>
  );
}
