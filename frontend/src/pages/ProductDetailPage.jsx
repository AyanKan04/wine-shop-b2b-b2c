import React, { useState } from 'react';
import { formatVND } from '../utils/formatters.js';
import apiService from '../services/api.js';

export default function ProductDetailPage({ productId, products, showToast }) {
  const prod = products.find(p => p.product_id === productId) || products[0];
  const [qty, setQty] = useState(prod ? prod.moq : 5);

  if (!prod) return <div className="page-container">Đang tải chi tiết sản phẩm...</div>;

  let currentTierPrice = (prod.tier_prices && prod.tier_prices.length > 0) ? prod.tier_prices[0].price_per_unit : (prod.base_price || 68000000);
  let currentTierLevel = 1;
  if (prod.tier_prices && prod.tier_prices.length > 0) {
    for (let t of prod.tier_prices) {
      if (qty >= t.min_quantity) {
        currentTierPrice = t.price_per_unit;
        currentTierLevel = t.tier_level;
      }
    }
  }

  const maxTierDiscount = (prod.tier_prices && prod.tier_prices.length > 0 && prod.tier_prices[0].price_per_unit > 0)
    ? Math.round((1 - prod.tier_prices[prod.tier_prices.length - 1].price_per_unit / prod.tier_prices[0].price_per_unit) * 100)
    : 0;

  return (
    <div className="page-container" style={{ maxWidth: '1300px' }}>
      {/* BREADCRUMB */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
        <span style={{ cursor: 'pointer' }}>Catalog</span> › <span style={{ cursor: 'pointer' }}>{prod.category}</span> › <span style={{ color: 'var(--text-main)' }}>{prod.product_name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '35px' }}>
        {/* LEFT: PRODUCT IMAGE */}
        <div>
          <div className="card-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', minHeight: '420px', position: 'relative' }}>
            {/* Category badge */}
            <div style={{
              position: 'absolute', top: '15px', left: '15px',
              background: 'rgba(212,175,55,0.15)', border: '1px solid var(--border-gold)',
              padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem',
              color: 'var(--accent-gold)', fontFamily: 'var(--font-brand)', letterSpacing: '0.5px'
            }}>
              {prod.category}
            </div>
            <img src={prod.image_url} alt={prod.product_name} style={{
              maxHeight: '380px', maxWidth: '100%', objectFit: 'contain',
              filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))'
            }} />
          </div>

          {/* SPECS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
            {[
              { label: 'Nồng Độ', value: `${prod.alcohol_content}% ABV`, icon: 'fa-flask', color: '#F59E0B' },
              { label: 'Dung Tích', value: `${prod.volume_ml}ml`, icon: 'fa-wine-bottle', color: '#3B82F6' },
              { label: 'Niên Vụ', value: String(prod.vintage_year), icon: 'fa-calendar', color: '#10B981' }
            ].map((spec, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px',
                padding: '14px', textAlign: 'center'
              }}>
                <i className={`fa-solid ${spec.icon}`} style={{ color: spec.color, fontSize: '1.1rem', marginBottom: '6px', display: 'block' }}></i>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>{spec.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{spec.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: PRODUCT INFO + TIER PRICING */}
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-brand)' }}>
              {prod.country_of_origin} · {prod.region}
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: '0 0 8px 0', lineHeight: 1.2 }}>{prod.product_name}</h2>
          <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '15px' }}>SKU: {prod.sku}</code>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.7 }}>{prod.description}</p>

          {/* PRODUCT ATTRIBUTES */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { label: 'Giống', value: prod.grape_variety },
              { label: 'MOQ', value: `${prod.moq} thùng` },
              { label: 'Chiết khấu tối đa', value: `-${maxTierDiscount}%` }
            ].map((attr, i) => (
              <div key={i} style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{attr.label}: </span>
                <strong style={{ color: 'var(--text-main)' }}>{attr.value}</strong>
              </div>
            ))}
          </div>

          {/* TIER PRICING TABLE */}
          <div className="card-box" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '12px', fontSize: '0.8rem', letterSpacing: '1px' }}>
              <i className="fa-solid fa-tags"></i> BẢNG GIÁ SỈ THEO BẬC SỐ LƯỢNG (TIER 1 → 5)
            </h4>
            <table className="data-table">
              <thead>
                <tr><th>BẬC</th><th>SỐ LƯỢNG TỐI THIỂU</th><th>ĐƠN GIÁ / THÙNG</th><th>TIẾT KIỆM</th></tr>
              </thead>
              <tbody>
                {prod.tier_prices && prod.tier_prices.map(t => {
                  const isActive = qty >= t.min_quantity;
                  const discount = Math.round((1 - t.price_per_unit / prod.tier_prices[0].price_per_unit) * 100);
                  return (
                    <tr key={t.tier_level} style={{
                      background: isActive ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-burgundy)' : '3px solid transparent'
                    }}>
                      <td>
                        <strong style={{ color: isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>Tier {t.tier_level}</strong>
                        {currentTierLevel === t.tier_level && <span style={{ fontSize: '0.65rem', color: '#346538', marginLeft: '6px' }}>← Hiện tại</span>}
                      </td>
                      <td>Từ <strong>{t.min_quantity}</strong> thùng</td>
                      <td className="gold-text"><strong>{formatVND(t.price_per_unit)}</strong></td>
                      <td>
                        {discount > 0 ? (
                          <span style={{ color: '#346538', fontWeight: '700' }}>-{discount}%</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Giá gốc</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* QUANTITY SELECTOR + PRICE CALC */}
          <div className="card-box" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem' }}>Chọn Số Lượng <span style={{ color: 'var(--text-muted)' }}>(MOQ: {prod.moq})</span>:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setQty(Math.max(prod.moq, qty - 5))} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', color: 'var(--text-main)', width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>−</button>
                <input type="number" value={qty} onChange={e => setQty(Math.max(prod.moq, parseInt(e.target.value) || prod.moq))} style={{ width: '70px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '1rem', fontWeight: '700' }} />
                <button onClick={() => setQty(qty + 5)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', color: 'var(--text-main)', width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>+</button>
              </div>
            </div>
            <input type="range" min={prod.moq} max="500" value={qty} onChange={e => setQty(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--text-main)', marginBottom: '15px' }} />

            {/* PRICE SUMMARY */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bậc giá hiện tại:</span>
                <strong style={{ color: 'var(--text-main)' }}>Tier {currentTierLevel} — {formatVND(currentTierPrice)}/thùng</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số lượng:</span>
                <strong style={{ color: 'var(--text-main)' }}>{qty} thùng</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Tổng Tiền Tạm Tính:</span>
                <span style={{ fontFamily: 'var(--font-brand)', fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '700' }}>
                  {formatVND(currentTierPrice * qty)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-redapron-gold" 
                style={{ flex: 1, padding: '14px' }} 
                onClick={async () => {
                  try {
                    const res = await apiService.createRFQ({ product_name: prod.product_name, quantity: qty, target_price: currentTierPrice * qty });
                    if(res.success) {
                      showToast(`Đã thêm ${qty} thùng "${prod.product_name}" vào Đơn Hàng Sỉ (RFQ #${res.rfq.rfq_id})!`);
                    }
                  } catch (err) {
                    showToast(err.message || 'Lỗi đặt hàng sỉ');
                  }
                }}>
                <i className="fa-solid fa-cart-shopping"></i> Đặt Hàng Sỉ
              </button>
              <button 
                className="btn-redapron-burgundy" 
                style={{ flex: 1, padding: '14px' }} 
                onClick={async () => {
                  try {
                    const res = await apiService.createRFQ({ product_name: prod.product_name, quantity: qty, target_price: currentTierPrice * qty });
                    if(res.success) {
                      showToast(`Đã khởi tạo RFQ #${res.rfq.rfq_id} cho ${qty} thùng ${prod.product_name}`);
                    }
                  } catch (err) {
                    showToast(err.message || 'Lỗi tạo RFQ');
                  }
                }}>
                <i className="fa-solid fa-paper-plane"></i> Tạo RFQ Đàm Phán
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
