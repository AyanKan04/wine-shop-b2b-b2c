import React, { useState } from 'react';
import NotificationCenter from './NotificationCenter.jsx';

export default function Navbar({ currentRoute, setCurrentRoute, currentUser, setCurrentUser, showToast }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAdmin = currentUser && currentUser.role !== 'BUYER_REP';

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentRoute('home');
    setDropdownOpen(false);
    showToast('Đã đăng xuất tài khoản sỉ B2B.');
  };

  return (
    <nav className="navbar">
      <a href="#" className="brand-logo" onClick={() => setCurrentRoute('home')}>
        <h1 className="gold-gradient-text">RED APRON</h1>
        <span>Fine Wines & Spirits B2B</span>
      </a>

      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* BUYER / CUSTOMER ROUTES */}
        <button className={currentRoute === 'home' ? 'active' : ''} onClick={() => setCurrentRoute('home')}>1. Trang Chủ</button>
        <button className={currentRoute === 'catalog' ? 'active' : ''} onClick={() => setCurrentRoute('catalog')}>2. Catalog & Lọc</button>
        <button className={currentRoute === 'product-detail' ? 'active' : ''} onClick={() => setCurrentRoute('product-detail')}>3. Chi Tiết Rượu</button>
        <button className={currentRoute === 'orders-credit' ? 'active' : ''} onClick={() => setCurrentRoute('orders-credit')}>4. Đơn Hàng & Nợ</button>

        {/* NOTIFICATION CENTER */}
        <NotificationCenter />

        {/* USER DROPDOWN (Replaces explicit Login & Register tabs) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '4px',
              transition: 'background 0.2s',
              outline: 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <i className="fa-regular fa-circle-user"></i>
            {currentUser ? (
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
                {currentUser.username}
              </span>
            ) : null}
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem', opacity: 0.7 }}></i>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: '#FFFFFF',
              border: '1px solid var(--border-gold)',
              borderRadius: '6px',
              width: '240px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              zIndex: 9999,
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {currentUser ? (
                <>
                  {/* User Info Header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đang đăng nhập</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser.company_name || currentUser.username}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', marginTop: '4px', fontWeight: '600' }}>
                      Vai trò: {currentUser.role === 'BUYER_REP' ? 'Mua Hàng B2B' : currentUser.role === 'SALES_REP' ? 'Kinh Doanh B2B' : currentUser.role === 'FINANCE_OFFICER' ? 'Kế Toán B2B' : currentUser.role === 'WAREHOUSE_STAFF' ? 'Quản Thủ Kho' : 'Quản Trị Platform'}
                    </div>
                  </div>

                  {/* Admin Shortcut */}
                  {isAdmin && (
                    <button
                      onClick={() => { setCurrentRoute('master-admin'); setDropdownOpen(false); }}
                      style={{
                        background: 'transparent', border: 'none', textAlign: 'left',
                        padding: '10px 16px', fontSize: '0.8rem', color: 'var(--text-main)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <i className="fa-solid fa-crown" style={{ color: 'var(--accent-gold)' }}></i>
                      Trang Quản Trị Admin
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'transparent', border: 'none', textAlign: 'left',
                      padding: '10px 16px', fontSize: '0.8rem', color: '#EF4444',
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    Đăng Xuất
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setCurrentRoute('login'); setDropdownOpen(false); }}
                    style={{
                      background: 'transparent', border: 'none', textAlign: 'left',
                      padding: '10px 16px', fontSize: '0.8rem', color: 'var(--text-main)',
                      cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="fa-solid fa-key" style={{ color: 'var(--accent-gold)' }}></i>
                    Đăng Nhập
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('register'); setDropdownOpen(false); }}
                    style={{
                      background: 'transparent', border: 'none', textAlign: 'left',
                      padding: '10px 16px', fontSize: '0.8rem', color: 'var(--text-main)',
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="fa-solid fa-building" style={{ color: 'var(--text-muted)' }}></i>
                    Đăng Ký B2B
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* UNIFIED ADMIN CONSOLE WORKSPACE ROUTE (Only visible to admin roles) */}
        {isAdmin && (
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
        )}
      </div>
    </nav>
  );
}
