import React, { useState } from 'react';

export default function CatalogPage({ products, onSelectProduct }) {
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filtered = products.filter(p => {
    if (filterCountry !== 'ALL' && p.country_of_origin !== filterCountry) return false;
    if (filterCategory !== 'ALL' && !p.category.includes(filterCategory)) return false;
    return true;
  });

  return (
    <div className="page-container">
      <h2 className="page-title">2. CATALOG & BỘ LỌC CHUYÊN SÂU RED APRON</h2>
      <p className="page-subtitle">Lọc chính xác theo Loại rượu, Quốc gia, Vùng đất, Giống nho & Nồng độ ABV</p>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '35px' }}>
        <aside className="card-box" style={{ height: 'fit-content' }}>
          <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px' }}>BỘ LỌC QUỐC GIA</h4>
          <div className="form-group">
            <select className="form-control" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="ALL">Tất cả Quốc Gia</option>
              <option value="France">Pháp (France)</option>
              <option value="Scotland">Scotland</option>
            </select>
          </div>

          <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '15px', marginTop: '25px' }}>DÒNG RƯỢU</h4>
          <div className="form-group">
            <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="ALL">Tất cả Dòng Rượu</option>
              <option value="Wine">Fine Wine (Vang)</option>
              <option value="Spirits">Spirits / Whisky</option>
              <option value="Champagne">Champagne</option>
            </select>
          </div>
        </aside>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
          {filtered.map(p => (
            <div key={p.product_id} className="card-box">
              <span style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)', padding: '3px 8px', fontSize: '0.7rem', border: '1px solid var(--border-gold)', borderRadius: '3px' }}>MOQ: {p.moq} Thùng</span>
              <img src={p.image_url} alt={p.product_name} style={{ width: '100%', height: '200px', objectFit: 'contain', margin: '15px 0' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '8px' }}>{p.product_name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><strong>Giống nho:</strong> {p.grape_variety}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}><strong>Vùng:</strong> {p.region} ({p.vintage_year})</p>
              <button className="btn-redapron-gold" style={{ width: '100%' }} onClick={() => onSelectProduct(p.product_id)}>Xem Bậc Giá Sỉ (Tier Pricing)</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
