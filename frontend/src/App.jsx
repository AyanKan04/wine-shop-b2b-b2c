import React, { useState, useEffect } from 'react';

// Layout Components
import TopBar from './components/TopBar.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AgeVerificationModal from './components/AgeVerificationModal.jsx';
import SommelierBotWidget from './components/SommelierBotWidget.jsx';

// Page Components
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CompanyRegisterPage from './pages/CompanyRegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RFQManagementPage from './pages/RFQManagementPage.jsx';
import OrdersCreditPage from './pages/OrdersCreditPage.jsx';

// Master Unified Admin Workspace Page
import MasterAdminWorkspacePage from './pages/MasterAdminWorkspacePage.jsx';

import apiService from './services/api.js';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [products, setProducts] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [credit, setCredit] = useState({ total_limit: 0, used_amount: 0, available_balance: 0 });
  const [invoices, setInvoices] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {


    // Load products
    apiService.getProducts()
      .then(res => { if (res.success && res.data && res.data.length > 0) setProducts(res.data); })
      .catch(() => {});

    // Load RFQs
    apiService.getRFQs()
      .then(res => { if (res.success && res.data && res.data.length > 0) setRfqs(res.data); })
      .catch(() => {});

    // Load Quotations
    apiService.getQuotations()
      .then(res => { if (res.success && res.data && res.data.length > 0) setQuotations(res.data); })
      .catch(() => {});

    // Load Orders
    apiService.getOrders()
      .then(res => { if (res.success && res.data && res.data.length > 0) setOrders(res.data); })
      .catch(() => {});

    // Load Credit Limit & Invoices
    apiService.getCreditLimit()
      .then(res => {
        if (res.success) {
          if (res.credit) setCredit(res.credit);
          if (res.invoices && res.invoices.length > 0) setInvoices(res.invoices);
        }
      })
      .catch(() => {});

    // Load Admin Licenses
    apiService.getAdminLicenses()
      .then(res => { if (res.success && res.data && res.data.length > 0) setLicenses(res.data); })
      .catch(() => {});

    // Load Inventory
    apiService.getInventory()
      .then(res => { if (res.success && res.inventory && res.inventory.length > 0) setInventory(res.inventory); })
      .catch(() => {});

    const token = localStorage.getItem('token');
    if (token) {
      apiService.getMe()
        .then(res => {
          if (res.success && res.data) {
            const user = res.data;
            if (!user.role && user.user_type) {
              user.role = user.user_type;
            }
            setCurrentUser(user);
            // Dynamic redirect if user lands on login/register/unauthorized admin page
            setCurrentRoute(prevRoute => {
              if (prevRoute === 'login' || prevRoute === 'register') {
                return user.role !== 'PLATFORM_ADMIN' ? 'home' : 'master-admin';
              }
              if (prevRoute === 'master-admin' && user.role !== 'PLATFORM_ADMIN') {
                return 'home';
              }
              return prevRoute;
            });
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navigateToProductDetail = (id) => {
    setSelectedProductId(id);
    setCurrentRoute('product-detail');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentRoute('home');
    showToast('Đã đăng xuất thành công.');
  };

  return (
    <div>
      <AgeVerificationModal />
      <TopBar currentUser={currentUser} />
      <Navbar currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} currentUser={currentUser} setCurrentUser={setCurrentUser} showToast={showToast} />

      <main>
        {currentRoute === 'home' && (
          <HomePage onNavigateCatalog={() => setCurrentRoute('catalog')} onSelectProduct={navigateToProductDetail} products={products} />
        )}
        {currentRoute === 'catalog' && (
          <CatalogPage products={products} onSelectProduct={navigateToProductDetail} />
        )}
        {currentRoute === 'product-detail' && (
          <ProductDetailPage productId={selectedProductId} products={products} showToast={showToast} />
        )}
        {currentRoute === 'login' && (
          <LoginPage
            showToast={showToast}
            onLoginSuccess={(user) => {
              const role = user.role || user.user_type;
              user.role = role;
              setCurrentUser(user);
              if (role === 'PLATFORM_ADMIN') {
                setCurrentRoute('master-admin');
              } else {
                setCurrentRoute('orders-credit');
              }
            }}
            onNavigateRegister={() => setCurrentRoute('register')}
          />
        )}
        {currentRoute === 'register' && (
          <CompanyRegisterPage
            showToast={showToast}
            onNavigateLogin={() => setCurrentRoute('login')}
          />
        )}
        {currentRoute === 'buyer-rfqs' && (
          <RFQManagementPage rfqs={rfqs} quotations={quotations} showToast={showToast} />
        )}
        {currentRoute === 'orders-credit' && (
          <OrdersCreditPage orders={orders} credit={credit} invoices={invoices} showToast={showToast} />
        )}

        {/* UNIFIED MASTER ADMIN CONSOLE WORKSPACE */}
        {currentRoute === 'master-admin' && (
          currentUser && currentUser.role !== 'BUYER_REP' ? (
            <MasterAdminWorkspacePage
              showToast={showToast}
              products={products}
              rfqs={rfqs}
              quotations={quotations}
              orders={orders}
              credit={credit}
              invoices={invoices}
              licenses={licenses}
              inventory={inventory}
            />
          ) : (
            <div className="page-container" style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--text-main)' }}>
                <i className="fa-solid fa-lock" style={{ fontSize: '2rem' }}></i>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '10px' }}>Yêu Cầu Quyền Quản Trị</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.6' }}>
                Không tìm thấy quyền truy cập Quản trị. Vui lòng đăng nhập bằng tài khoản có vai trò phù hợp (Kinh doanh, Kế toán, Thủ kho, Quản trị viên).
              </p>
              <button className="btn-redapron-gold" onClick={() => setCurrentRoute('login')} style={{ padding: '12px 24px' }}>Đăng Nhập Ngay</button>
            </div>
          )
        )}
      </main>

      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <i className="fa-solid fa-circle-check gold-text"></i> {toastMessage}
          </div>
        </div>
      )}

      <SommelierBotWidget />
      <Footer />
    </div>
  );
}
