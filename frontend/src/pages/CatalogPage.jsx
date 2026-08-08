import React, { useState } from 'react';
import Skeleton from '../components/ui/Skeleton.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import apiService from '../services/api.js';

export default function CatalogPage({ products, isLoading, onSelectProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Derive unique countries from product data
  const countries = [...new Set((products || []).map(p => p.country_of_origin))];
  const categories = [...new Set((products || []).map(p => p.category))];

  const formatVND = (val) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ ₫';
    if (val >= 1000000) return (val / 1000000).toFixed(0) + ' Tr ₫';
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  const getTierPrice = (p, index) => {
    if (!p) return 0;
    if (Array.isArray(p.tier_prices) && p.tier_prices.length > 0) {
      if (index === 'last') {
        return p.tier_prices[p.tier_prices.length - 1]?.price_per_unit ?? p.base_price ?? 0;
      }
      return p.tier_prices[index]?.price_per_unit ?? p.base_price ?? 0;
    }
    return p.base_price ?? p.Price ?? 0;
  };

  let filtered = (products || []).filter(p => {
    const matchSearch = searchTerm === '' ||
      (p.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.grape_variety || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCountry = filterCountry === 'ALL' || p.country_of_origin === filterCountry;
    const matchCategory = filterCategory === 'ALL' || p.category === filterCategory;
    const price = Number(p.base_price) || 0;
    const matchMin = minPrice === '' || price >= Number(minPrice);
    const matchMax = maxPrice === '' || price <= Number(maxPrice);

    return matchSearch && matchCountry && matchCategory && matchMin && matchMax;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc': return (a.product_name || '').localeCompare(b.product_name || '');
      case 'name_desc': return (b.product_name || '').localeCompare(a.product_name || '');
      case 'price_asc': return getTierPrice(a, 0) - getTierPrice(b, 0);
      case 'price_desc': return getTierPrice(b, 0) - getTierPrice(a, 0);
      case 'abv_desc': return (b.alcohol_content || 0) - (a.alcohol_content || 0);
      default: return 0;
    }
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCountry('ALL');
    setFilterCategory('ALL');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name_asc');
  };

  const hasActiveFilters = searchTerm || filterCountry !== 'ALL' || filterCategory !== 'ALL' || minPrice !== '' || maxPrice !== '';

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '25px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'var(--font-brand)', marginBottom: '8px' }}>
          <i className="fa-solid fa-wine-glass"></i> RedApron B2B Catalog
        </p>
        <h2 className="page-title" style={{ margin: 0 }}>CATALOG & BỘ LỌC CHUYÊN SÂU</h2>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Lọc chính xác theo Loại rượu, Quốc gia, Giống nho & sắp xếp theo giá sỉ hoặc nồng độ ABV.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '25px' }}>
        {/* ═══════ SIDEBAR FILTERS ═══════ */}
        <aside>
          {/* SEARCH */}
          <div className="card-box" style={{ marginBottom: '16px' }}>
            <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '12px' }}>
              <i className="fa-solid fa-magnifying-glass"></i> TÌM KIẾM
            </h4>
            <input
              type="text"
              className="form-control"
              placeholder="Tên rượu, SKU, giống nho..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* PRICE RANGE */}
          <div className="card-box" style={{ marginBottom: '16px' }}>
            <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '12px' }}>
              <i className="fa-solid fa-money-bill-wave"></i> KHOẢNG GIÁ (VNĐ)
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                className="form-control" 
                placeholder="TỐI THIỂU" 
                value={minPrice} 
                onChange={e => setMinPrice(e.target.value)} 
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input 
                type="number" 
                className="form-control" 
                placeholder="TỐI ĐA" 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)} 
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* COUNTRY */}
          <div className="card-box" style={{ marginBottom: '16px' }}>
            <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '12px' }}>
              <i className="fa-solid fa-globe"></i> QUỐC GIA XUẤT XỨ
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: filterCountry === 'ALL' ? 'var(--primary-gold)' : 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="radio" name="country" checked={filterCountry === 'ALL'} onChange={() => setFilterCountry('ALL')} />
                Tất cả ({(products || []).length})
              </label>
              {countries.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: filterCountry === c ? 'var(--primary-gold)' : 'var(--text-muted)', cursor: 'pointer' }}>
                  <input type="radio" name="country" checked={filterCountry === c} onChange={() => setFilterCountry(c)} />
                  {c} ({(products || []).filter(p => p.country_of_origin === c).length})
                </label>
              ))}
            </div>
          </div>

          {/* CATEGORY */}
          <div className="card-box" style={{ marginBottom: '16px' }}>
            <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '12px' }}>
              <i className="fa-solid fa-tags"></i> DÒNG RƯỢU
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: filterCategory === 'ALL' ? 'var(--primary-gold)' : 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="radio" name="category" checked={filterCategory === 'ALL'} onChange={() => setFilterCategory('ALL')} />
                Tất cả
              </label>
              {categories.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: filterCategory === c ? 'var(--primary-gold)' : 'var(--text-muted)', cursor: 'pointer' }}>
                  <input type="radio" name="category" checked={filterCategory === c} onChange={() => setFilterCategory(c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          {/* CLEAR FILTERS */}
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{
              width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
            }}>
              <i className="fa-solid fa-xmark"></i> Xóa Tất Cả Bộ Lọc
            </button>
          )}
        </aside>

        {/* ═══════ MAIN CONTENT ═══════ */}
        <div>
          {/* TOOLBAR: SORT + VIEW MODE + COUNT */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Hiển thị <strong style={{ color: 'var(--text-main)' }}>{filtered.length}</strong> / {products.length} sản phẩm
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* SORT */}
              <select className="form-control" style={{ width: '220px', padding: '8px 12px', fontSize: '0.8rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="name_asc">Tên A → Z</option>
                <option value="name_desc">Tên Z → A</option>
                <option value="price_asc">Giá Tier 1: Thấp → Cao</option>
                <option value="price_desc">Giá Tier 1: Cao → Thấp</option>
                <option value="abv_desc">ABV: Cao nhất</option>
              </select>

              {/* VIEW TOGGLE */}
              <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 12px', border: 'none', borderRadius: '6px 0 0 6px',
                    background: viewMode === 'grid' ? '#111111' : 'transparent',
                    color: viewMode === 'grid' ? '#FFF' : 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-grid-2"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px 12px', border: 'none', borderRadius: '0 6px 6px 0',
                    background: viewMode === 'list' ? '#111111' : 'transparent',
                    color: viewMode === 'list' ? '#FFF' : 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-list"></i>
                </button>
              </div>
            </div>
          </div>

          {/* CONDITIONAL RENDERING: LOADING -> EMPTY -> CONTENT */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {Array(6).fill(0).map((_, idx) => (
                <div key={`skel-${idx}`} className="card-box" style={{ padding: '20px', background: '#fff', borderRadius: '8px' }}>
                  <Skeleton height="20px" width="30%" style={{ marginBottom: '10px' }} />
                  <Skeleton height="200px" style={{ marginBottom: '15px' }} />
                  <Skeleton height="24px" width="80%" style={{ marginBottom: '10px' }} />
                  <Skeleton height="20px" width="60%" style={{ marginBottom: '10px' }} />
                  <Skeleton height="40px" width="100%" style={{ marginTop: '20px' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-wine-glass" style={{ fontSize: '3rem', marginBottom: '15px', display: 'block', opacity: 0.3 }}></i>
              <p style={{ fontSize: '1rem' }}>Không tìm thấy sản phẩm phù hợp với bộ lọc.</p>
              <button onClick={clearFilters} className="btn-redapron-gold" style={{ marginTop: '15px', padding: '10px 25px' }}>
                Xóa Bộ Lọc
              </button>
            </div>
          ) : (
            <>
              {/* PRODUCT GRID VIEW */}
              {viewMode === 'grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {filtered.map(p => (
                    <ProductCard key={p.product_id} p={p} onSelectProduct={onSelectProduct} />
                  ))}
                </div>
              )}

              {/* PRODUCT LIST VIEW */}
              {viewMode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filtered.map(p => (
                    <div key={p.product_id} className="card-box" style={{
                      padding: '16px 20px', display: 'flex', gap: '20px', alignItems: 'center', cursor: 'pointer'
                    }} onClick={() => onSelectProduct(p.product_id)}>
                      <div style={{ width: '80px', height: '80px', background: '#F8F9FA', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={apiService.getMediaUrl(p.image_url)} alt={p.product_name} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)', padding: '2px 8px', fontSize: '0.65rem', border: '1px solid var(--border-gold)', borderRadius: '3px' }}>{p.category}</span>
                          <code style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.sku}</code>
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '4px' }}>{p.product_name}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                          {p.country_of_origin} · {p.region} · {p.grape_variety} · ABV {p.alcohol_content}% · MOQ {p.moq} thùng
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '25px', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Tier 1</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-gold)' }}>{formatVND(getTierPrice(p, 0))}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.6rem', color: '#10B981' }}>Tier 5</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#10B981' }}>{formatVND(getTierPrice(p, 'last'))}</div>
                        </div>
                        <button className="btn-redapron-gold" style={{ padding: '8px 16px', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={(e) => { e.stopPropagation(); onSelectProduct(p.product_id); }}>
                          Chi Tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
