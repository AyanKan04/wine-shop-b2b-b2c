import React, { useState } from 'react';
import { formatVND } from '../utils/formatters.js';

export default function ProductDetailPage({ productId, products, showToast }) {
  const prod = products.find(p => p.product_id === productId) || products[0];
  const [qty, setQty] = useState(prod ? prod.moq : 5);

  if (!prod) return <div className="page-container">Đang tải chi tiết sản phẩm...</div>;

  let currentTierPrice = prod.tier_prices ? prod.tier_prices[0].price_per_unit : 85000000;
  if (prod.tier_prices) {
    for (let t of prod.tier_prices) {
      if (qty >= t.min_quantity) currentTierPrice = t.price_per_unit;
    }
  }

  return (
    <div className="page-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div className="card-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={prod.image_url} alt={prod.product_name} style={{ maxHeight: '420px', objectFit: 'contain' }} />
        </div>

        <div>
          <span className="gold-text" style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>{prod.country_of_origin} • {prod.region}</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: '10px 0' }}>{prod.product_name}</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>{prod.description}</p>

          <div className="card-box" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 className="gold-text" style={{ fontFamily: 'var(--font-brand)', marginBottom: '10px' }}>BẢNG GIÁ SỈ THEO BẬC SỐ LƯỢNG (TIER PRICING 1 - 5)</h4>
            <table className="data-table">
              <thead>
                <tr><th>BẬC (TIER)</th><th>SỐ LƯỢNG MUA</th><th>ĐƠN GIÁ / THÙNG</th></tr>
              </thead>
              <tbody>
                {prod.tier_prices && prod.tier_prices.map(t => (
                  <tr key={t.tier_level} style={{ background: qty >= t.min_quantity ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
                    <td>Tier {t.tier_level}</td>
                    <td>Từ {t.min_quantity} thùng</td>
                    <td className="gold-text"><strong>{formatVND(t.price_per_unit)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-box" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Chọn Số Lượng Mua (MOQ: {prod.moq} thùng):</span>
              <strong className="gold-text">{qty} Thùng</strong>
            </div>
            <input type="range" min={prod.moq} max="300" value={qty} onChange={e => setQty(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-gold)', marginBottom: '15px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
              <span>Tổng Tiền Tạm Tính:</span>
              <span style={{ fontFamily: 'var(--font-brand)', fontSize: '1.4rem', color: '#FFF' }}>{formatVND(currentTierPrice * qty)}</span>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn-redapron-gold" style={{ flex: 1 }} onClick={() => showToast(`Đã thêm ${qty} thùng vào Đơn Hàng Sỉ!`)}>Đặt Hàng Sỉ Theo MOQ</button>
              <button className="btn-redapron-burgundy" style={{ flex: 1 }} onClick={() => showToast(`Đã khởi tạo RFQ cho ${qty} thùng ${prod.product_name}`)}>Tạo RFQ Đàm Phán Giá</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
