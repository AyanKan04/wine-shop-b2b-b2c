import React from 'react';

export default function Navbar({ currentRoute, setCurrentRoute }) {
  return (
    <nav className="navbar">
      <a href="#" className="brand-logo" onClick={() => setCurrentRoute('home')}>
        <h1 className="gold-gradient-text">RED APRON</h1>
        <span>Fine Wines & Spirits B2B</span>
      </a>

      <div className="nav-links">
        {/* KHU VỰC KHÁCH HÀNG (BUYER) */}
        <button className={currentRoute === 'home' ? 'active' : ''} onClick={() => setCurrentRoute('home')}>1. Trang Chủ</button>
        <button className={currentRoute === 'catalog' ? 'active' : ''} onClick={() => setCurrentRoute('catalog')}>2. Catalog & Lọc</button>
        <button className={currentRoute === 'product-detail' ? 'active' : ''} onClick={() => setCurrentRoute('product-detail')}>3. Chi Tiết Rượu</button>
        <button className={currentRoute === 'register' ? 'active' : ''} onClick={() => setCurrentRoute('register')}>4. Đăng Ký ĐKKD</button>
        <button className={currentRoute === 'buyer-rfqs' ? 'active' : ''} onClick={() => setCurrentRoute('buyer-rfqs')}>5. Quản Lý RFQ</button>
        <button className={currentRoute === 'orders-credit' ? 'active' : ''} onClick={() => setCurrentRoute('orders-credit')}>6. Đơn Hàng & Nợ</button>

        {/* KHU VỰC QUẢN TRỊ & NHÂN VIÊN */}
        <button className={`zone-admin ${currentRoute === 'admin-approval' ? 'active' : ''}`} onClick={() => setCurrentRoute('admin-approval')}>7. Admin Duyệt</button>
        <button className={`zone-admin ${currentRoute === 'sales-products' ? 'active' : ''}`} onClick={() => setCurrentRoute('sales-products')}>8. Sales Đăng Giá</button>
        <button className={`zone-admin ${currentRoute === 'sales-rfq' ? 'active' : ''}`} onClick={() => setCurrentRoute('sales-rfq')}>9. Xử Lý Báo Giá</button>
        <button className={`zone-admin ${currentRoute === 'finance-mgmt' ? 'active' : ''}`} onClick={() => setCurrentRoute('finance-mgmt')}>10. Kế Toán Nợ</button>
        <button className={`zone-admin ${currentRoute === 'warehouse-logistics' ? 'active' : ''}`} onClick={() => setCurrentRoute('warehouse-logistics')}>11. Kho & Vận Chuyển</button>
      </div>
    </nav>
  );
}
