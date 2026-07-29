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
  const [currentRoute, setCurrentRoute] = useState('master-admin');
  const [selectedProductId, setSelectedProductId] = useState(101);
  const [currentUser, setCurrentUser] = useState(null);

  const [products, setProducts] = useState([
    {
      product_id: 101,
      sku: "SKU-SCOT-MAC18",
      product_name: "Macallan 18 Year Old Sherry Oak Single Malt",
      category: "Spirits / Whisky",
      country_of_origin: "Scotland",
      region: "Highland",
      grape_variety: "Malted Barley",
      vintage_year: 2018,
      alcohol_content: 43.0,
      volume_ml: 700,
      moq: 5,
      image_url: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80",
      description: "Dòng Single Malt Whisky danh tiếng từ vùng Highland Scotland, ủ 18 năm trong thùng gỗ sồi Sherry Oak Tây Ban Nha.",
      tier_prices: [
        { tier_level: 1, min_quantity: 5, price_per_unit: 85000000 },
        { tier_level: 2, min_quantity: 20, price_per_unit: 78000000 },
        { tier_level: 3, min_quantity: 50, price_per_unit: 72500000 },
        { tier_level: 4, min_quantity: 100, price_per_unit: 68000000 },
        { tier_level: 5, min_quantity: 200, price_per_unit: 64000000 }
      ]
    },
    {
      product_id: 102,
      sku: "SKU-FR-MARGAUX2018",
      product_name: "Château Margaux Premier Grand Cru Classé 2018",
      category: "Fine Wine",
      country_of_origin: "France",
      region: "Bordeaux (Margaux AOC)",
      grape_variety: "Cabernet Sauvignon, Merlot",
      vintage_year: 2018,
      alcohol_content: 13.5,
      volume_ml: 750,
      moq: 10,
      image_url: "https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?auto=format&fit=crop&w=800&q=80",
      description: "Vang đỏ huyền thoại thuộc bảng xếp hạng Premier Grand Cru Classé 1855 trứ danh vùng Margaux Bordeaux.",
      tier_prices: [
        { tier_level: 1, min_quantity: 10, price_per_unit: 120000000 },
        { tier_level: 2, min_quantity: 30, price_per_unit: 110000000 },
        { tier_level: 3, min_quantity: 100, price_per_unit: 98000000 },
        { tier_level: 4, min_quantity: 250, price_per_unit: 92000000 },
        { tier_level: 5, min_quantity: 500, price_per_unit: 85000000 }
      ]
    },
    {
      product_id: 103,
      sku: "SKU-FR-DOM2012",
      product_name: "Dom Pérignon Vintage Brut Champagne 2012",
      category: "Champagne",
      country_of_origin: "France",
      region: "Champagne AOC",
      grape_variety: "Chardonnay, Pinot Noir",
      vintage_year: 2012,
      alcohol_content: 12.5,
      volume_ml: 750,
      moq: 8,
      image_url: "https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80",
      description: "Tuyệt phẩm Sâm-panh Pháp niên hiệu 2012 đạt sự cân bằng tuyệt hảo giữa hương hoa quả nhiệt đới và khoáng chất.",
      tier_prices: [
        { tier_level: 1, min_quantity: 8, price_per_unit: 45000000 },
        { tier_level: 2, min_quantity: 25, price_per_unit: 41000000 },
        { tier_level: 3, min_quantity: 75, price_per_unit: 37500000 },
        { tier_level: 4, min_quantity: 150, price_per_unit: 34000000 },
        { tier_level: 5, min_quantity: 300, price_per_unit: 31000000 }
      ]
    },
    {
      product_id: 104,
      sku: "SKU-FR-HENNESSY-XO",
      product_name: "Hennessy X.O Cognac Extra Old Edition",
      category: "Cognac",
      country_of_origin: "France",
      region: "Cognac AOC",
      grape_variety: "Ugni Blanc",
      vintage_year: 2020,
      alcohol_content: 40.0,
      volume_ml: 700,
      moq: 6,
      image_url: "https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=800&q=80",
      description: "Cognac Hennessy X.O huyền thoại, pha trộn từ trên 100 loại eaux-de-vie, ủ trong thùng gỗ sồi Pháp mang hương vị đẳng cấp.",
      tier_prices: [
        { tier_level: 1, min_quantity: 6, price_per_unit: 58000000 },
        { tier_level: 2, min_quantity: 20, price_per_unit: 54000000 },
        { tier_level: 3, min_quantity: 50, price_per_unit: 50000000 },
        { tier_level: 4, min_quantity: 100, price_per_unit: 46000000 },
        { tier_level: 5, min_quantity: 200, price_per_unit: 42000000 }
      ]
    }
  ]);

  const [rfqs, setRfqs] = useState([
    { rfq_id: 8842, buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', title: 'Đơn đàm phán rượu Macallan 18 sự kiện Tết 2027', product_name: 'Macallan 18 Year Old Single Malt', quantity: 150, target_price: 68000000, status: 'SUBMITTED' }
  ]);
  const [quotations, setQuotations] = useState([
    { quotation_id: 9910, rfq_id: 8842, offer_unit_price: 68500000, quantity: 150, valid_until: '2026-08-20', status: 'PENDING' }
  ]);
  const [orders, setOrders] = useState([
    { order_id: 501, order_number: 'ORD-2026-8821', buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', total_amount: 200000000, order_status: 'DELIVERED' }
  ]);
  const [credit, setCredit] = useState({ total_limit: 1000000000, used_amount: 350000000, available_balance: 650000000 });
  const [invoices, setInvoices] = useState([
    { invoice_id: 91, invoice_number: 'INV-2026-0091', order_number: 'ORD-2026-8821', due_date: '2026-08-15', amount: 200000000, status: 'PAID' },
    { invoice_id: 104, invoice_number: 'INV-2026-0104', order_number: 'ORD-2026-8842', due_date: '2026-08-20', amount: 150000000, status: 'UNPAID' }
  ]);
  const [licenses, setLicenses] = useState([
    { license_id: 1, company_id: 1, license_type: 'Giấy phép Bán buôn Rượu', license_number: '108/GP-BCT', status: 'VERIFIED' }
  ]);
  const [inventory, setInventory] = useState([
    { product_id: 101, sku: 'SKU-SCOT-MAC18', product_name: 'Macallan 18 Year Old Sherry Oak Single Malt', stock_on_hand: 450, reserved: 150, min_stock_level: 50, location: 'Kho A1 - Quận 7' },
    { product_id: 102, sku: 'SKU-FR-MARGAUX2018', product_name: 'Château Margaux Premier Grand Cru Classé 2018', stock_on_hand: 280, reserved: 50, min_stock_level: 30, location: 'Kho A1 - Quận 7' },
    { product_id: 103, sku: 'SKU-FR-DOM2012', product_name: 'Dom Pérignon Vintage Brut Champagne 2012', stock_on_hand: 600, reserved: 80, min_stock_level: 60, location: 'Kho B2 - Quận 2' },
    { product_id: 104, sku: 'SKU-FR-HENNESSY-XO', product_name: 'Hennessy X.O Cognac Extra Old Edition', stock_on_hand: 320, reserved: 40, min_stock_level: 40, location: 'Kho B2 - Quận 2' }
  ]);

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    // Check user session
    const token = localStorage.getItem('token');
    if (token) {
      apiService.getMe()
        .then(res => {
          if (res.success && res.data) {
            setCurrentUser(res.data);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }

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

    // Restore session if token exists
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
                return user.role !== 'BUYER_REP' ? 'master-admin' : 'orders-credit';
              }
              if (prevRoute === 'master-admin' && user.role === 'BUYER_REP') {
                return 'orders-credit';
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
              setCurrentUser(user);
              if (user.role !== 'BUYER_REP') {
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
