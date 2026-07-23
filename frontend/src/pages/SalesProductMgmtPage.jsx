import React from 'react';

export default function SalesProductMgmtPage({ showToast }) {
  return (
    <div className="page-container">
      <h2 className="page-title burgundy-text">8. SALES MANAGEMENT: ĐĂNG SẢN PHẨM & CẤU HÌNH TIER PRICE</h2>
      <p className="page-subtitle">Thêm dòng rượu mới, đặt số lượng MOQ và thiết lập 5 bậc giá sỉ (Tier 1 đến Tier 5)</p>

      <div className="card-box">
        <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>THÊM DÒNG RƯỢU MỚI & CẤU HÌNH BẬC GIÁ SỈ</h4>
        <form onSubmit={e => { e.preventDefault(); showToast('Đã lưu cấu hình Giá sỉ Tier 1-5 cho sản phẩm mới!'); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group"><label>Tên Sản Phẩm Rượu</label><input className="form-control" defaultValue="Château Lafite Rothschild 2015" required /></div>
            <div className="form-group"><label>Mã SKU</label><input className="form-control" defaultValue="SKU-FR-LAFITE2015" required /></div>
            <div className="form-group"><label>Số Lượng Mua Tối Thiểu (MOQ)</label><input type="number" className="form-control" defaultValue="5" required /></div>
            <div className="form-group"><label>Giá Niêm Yết Tier 1 (5-19 thùng)</label><input className="form-control" defaultValue="150,000,000 VNĐ" required /></div>
          </div>
          <button type="submit" className="btn-redapron-gold">Lưu & Đăng Sản Phẩm Lên Sàn</button>
        </form>
      </div>
    </div>
  );
}
