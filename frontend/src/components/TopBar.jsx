import React from 'react';

export default function TopBar() {
  return (
    <div className="top-bar">
      <div className="compliance-badge">
        <i className="fa-solid fa-shield-halved"></i>
        <span>RedApron B2B Verification: 100% Giấy Phép Rượu Hợp Lệ (NĐ 105/2017/NĐ-CP)</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Express API: http://localhost:5000/api
      </div>
    </div>
  );
}
