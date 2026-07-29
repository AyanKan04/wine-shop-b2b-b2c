import React from 'react';
import NotificationCenter from './NotificationCenter.jsx';

export default function Navbar({ currentRoute, setCurrentRoute }) {
  return (
    <nav className="navbar">
      <a href="#" className="brand-logo" onClick={() => setCurrentRoute('home')}>
        <h1 className="gold-gradient-text">RED APRON</h1>
        <span>Fine Wines & Spirits B2B</span>
      </a>

      <div className="nav-links">
        {/* BUYER / CUSTOMER ROUTES */}
        <button className={currentRoute === 'home' ? 'active' : ''} onClick={() => setCurrentRoute('home')}>1. Trang Chủ</button>
        <button className={currentRoute === 'catalog' ? 'active' : ''} onClick={() => setCurrentRoute('catalog')}>2. Catalog & Lọc</button>
        <button className={currentRoute === 'product-detail' ? 'active' : ''} onClick={() => setCurrentRoute('product-detail')}>3. Chi Tiết Rượu</button>
        <button className={currentRoute === 'login' ? 'active' : ''} onClick={() => setCurrentRoute('login')}>4. Đăng Nhập</button>
        <button className={currentRoute === 'register' ? 'active' : ''} onClick={() => setCurrentRoute('register')}>5. Đăng Ký B2B</button>
        <button className={currentRoute === 'orders-credit' ? 'active' : ''} onClick={() => setCurrentRoute('orders-credit')}>6. Đơn Hàng & Nợ</button>

        {/* NOTIFICATION CENTER */}
        <NotificationCenter />

        {/* UNIFIED ADMIN CONSOLE WORKSPACE ROUTE */}
        <button
          className={`zone-admin ${currentRoute === 'master-admin' ? 'active' : ''}`}
          onClick={() => setCurrentRoute('master-admin')}
          style={{
            background: currentRoute === 'master-admin' ? 'var(--accent-burgundy)' : 'rgba(229, 77, 96, 0.15)',
            border: '1px solid #E54D60',
            color: '#FFF',
            fontWeight: '700'
          }}
        >
          <i className="fa-solid fa-crown" style={{ marginRight: '6px', color: 'var(--accent-gold)' }}></i>
          TRANG QUẢN TRỊ MASTER ADMIN
        </button>
      </div>
    </nav>
  );
}
