import React from 'react';

export default function Navbar({ currentRoute, setCurrentRoute }) {
  return (
    <nav className="navbar">
      <a href="#" className="brand-logo" onClick={() => setCurrentRoute('home')}>
        <h1 className="gold-gradient-text">RED APRON</h1>
        <span>Fine Wines & Spirits B2B</span>
      </a>

      <div className="nav-links">
        {/* BUYER / GENERAL ROUTING */}
        <button className={currentRoute === 'home' ? 'active' : ''} onClick={() => setCurrentRoute('home')}>1. Trang Chủ</button>
        <button className={currentRoute === 'catalog' ? 'active' : ''} onClick={() => setCurrentRoute('catalog')}>2. Catalog & Lọc</button>
        <button className={currentRoute === 'product-detail' ? 'active' : ''} onClick={() => setCurrentRoute('product-detail')}>3. Chi Tiết Rượu</button>
        <button className={currentRoute === 'auth' ? 'active' : ''} onClick={() => setCurrentRoute('auth')}>4. Portal Đăng Nhập / B2B</button>
        <button className={currentRoute === 'buyer-rfqs' ? 'active' : ''} onClick={() => setCurrentRoute('buyer-rfqs')}>5. Quản Lý RFQ</button>
        <button className={currentRoute === 'orders-credit' ? 'active' : ''} onClick={() => setCurrentRoute('orders-credit')}>6. Đơn Hàng & Nợ</button>

        {/* CRM KANBAN & MANAGEMENT ROUTING */}
        <button className={`zone-admin ${currentRoute === 'kanban-dashboard' ? 'active' : ''}`} onClick={() => setCurrentRoute('kanban-dashboard')}>
          <i className="fa-solid fa-square-kanban" style={{ marginRight: '4px' }}></i> CRM Kanban
        </button>
        <button className={`zone-admin ${currentRoute === 'admin-dashboard' ? 'active' : ''}`} onClick={() => setCurrentRoute('admin-dashboard')}>
          <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i> Admin Dashboard
        </button>
        <button className={`zone-admin ${currentRoute === 'sales-products' ? 'active' : ''}`} onClick={() => setCurrentRoute('sales-products')}>9. Sales Đăng Giá</button>
        <button className={`zone-admin ${currentRoute === 'sales-rfq' ? 'active' : ''}`} onClick={() => setCurrentRoute('sales-rfq')}>10. Xử Lý Báo Giá</button>
        <button className={`zone-admin ${currentRoute === 'finance-mgmt' ? 'active' : ''}`} onClick={() => setCurrentRoute('finance-mgmt')}>11. Kế Toán Nợ</button>
        <button className={`zone-admin ${currentRoute === 'warehouse-logistics' ? 'active' : ''}`} onClick={() => setCurrentRoute('warehouse-logistics')}>12. Kho & Vận Chuyển</button>
      </div>
    </nav>
  );
}
