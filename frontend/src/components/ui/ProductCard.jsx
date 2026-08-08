import React from 'react';
import apiService from '../../services/api';

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

export default function ProductCard({ p, onSelectProduct }) {
  return (
    <div className="card-box product-card" onClick={() => onSelectProduct(p.product_id)}>
      <div className="product-card-header">
        <span className="product-badge">{p.category}</span>
        <code className="product-sku">{p.sku}</code>
      </div>
      <div className="product-image-container">
        <img src={apiService.getMediaUrl(p.image_url)} alt={p.product_name} className="product-image" />
      </div>
      <h3 className="product-title">{p.product_name}</h3>
      <p className="product-meta">
        <i className="fa-solid fa-map-pin gold-text" style={{ marginRight: '4px' }}></i>
        {p.country_of_origin} · {p.region}
      </p>
      <p className="product-meta">
        <strong>Giống:</strong> {p.grape_variety} | <strong>ABV:</strong> {p.alcohol_content}% | <strong>MOQ:</strong> {p.moq}
      </p>

      <div className="product-price-section">
        <div>
          <div className="price-label">Giá Tier 1</div>
          <div className="price-value tier-1">{formatVND(getTierPrice(p, 0))}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="price-label tier-last-label">Giá Tier 5</div>
          <div className="price-value tier-last">{formatVND(getTierPrice(p, 'last'))}</div>
        </div>
      </div>
    </div>
  );
}
