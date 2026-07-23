import React from 'react';

export default function HomePage({ onNavigateCatalog, onSelectProduct, products }) {
  return (
    <div>
      <section className="hero-section">
        <div className="hero-content">
          <p style={{ letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--accent-gold)', fontSize: '0.85rem', marginBottom: '15px' }}>
            B2B Fine Wines & Premium Spirits
          </p>
          <h1 className="hero-title">RED APRON B2B FINE WINES PLATFORM</h1>
          <p className="hero-subtitle">Giải pháp phân phối sỉ rượu B2B chuyên biệt dành cho Khách sạn 5 sao, Nhà hàng cao cấp, Đại lý & Siêu thị toàn quốc.</p>
          <button className="btn-redapron-gold" onClick={onNavigateCatalog}>Khám Phá Catalog RedApron</button>
        </div>
      </section>

      <div className="page-container">
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 className="page-title">BỘ BẢO TỒN VANG & RƯỢU MẠNH CAO CẤP</h2>
          <p className="page-subtitle">Tuyển chọn các chai rượu Bordeaux Premier Cru, Single Malt Whisky và Champagne Pháp trứ danh</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          {products.slice(0, 3).map(p => (
            <div key={p.product_id} className="card-box" style={{ padding: '20px' }}>
              <img src={p.image_url} alt={p.product_name} style={{ width: '100%', height: '220px', objectFit: 'contain', marginBottom: '15px' }} />
              <p style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', letterSpacing: '1px' }}>{p.country_of_origin} • {p.region}</p>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: '8px 0' }}>{p.product_name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>MOQ: {p.moq} Thùng | ABV: {p.alcohol_content}%</p>
              <button className="btn-redapron-gold" style={{ width: '100%' }} onClick={() => onSelectProduct(p.product_id)}>Xem Chi Tiết & Giá Sỉ Tier</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
