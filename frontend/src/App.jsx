import React, { useState, useEffect } from 'react';

// Layout Components
import TopBar from './components/TopBar.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

// Page Components
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CompanyRegisterPage from './pages/CompanyRegisterPage.jsx';
import RFQManagementPage from './pages/RFQManagementPage.jsx';
import OrdersCreditPage from './pages/OrdersCreditPage.jsx';

import AdminApprovalPage from './pages/AdminApprovalPage.jsx';
import SalesProductMgmtPage from './pages/SalesProductMgmtPage.jsx';
import RFQProcessingPage from './pages/RFQProcessingPage.jsx';
import FinanceMgmtPage from './pages/FinanceMgmtPage.jsx';
import WarehouseLogisticsPage from './pages/WarehouseLogisticsPage.jsx';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(101);

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
    { product_id: 101, sku: 'SKU-SCOT-MAC18', stock_on_hand: 450, reserved: 150 },
    { product_id: 102, sku: 'SKU-FR-MARGAUX2018', stock_on_hand: 280, reserved: 50 }
  ]);

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => { if (data.success) setProducts(data.data); })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navigateToProductDetail = (id) => {
    setSelectedProductId(id);
    setCurrentRoute('product-detail');
  };

  return (
    <div>
      <TopBar />
      <Navbar currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} />

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
        {currentRoute === 'register' && (
          <CompanyRegisterPage showToast={showToast} />
        )}
        {currentRoute === 'buyer-rfqs' && (
          <RFQManagementPage rfqs={rfqs} quotations={quotations} showToast={showToast} />
        )}
        {currentRoute === 'orders-credit' && (
          <OrdersCreditPage orders={orders} credit={credit} invoices={invoices} showToast={showToast} />
        )}
        {currentRoute === 'admin-approval' && (
          <AdminApprovalPage licenses={licenses} showToast={showToast} />
        )}
        {currentRoute === 'sales-products' && (
          <SalesProductMgmtPage products={products} showToast={showToast} />
        )}
        {currentRoute === 'sales-rfq' && (
          <RFQProcessingPage rfqs={rfqs} showToast={showToast} />
        )}
        {currentRoute === 'finance-mgmt' && (
          <FinanceMgmtPage credit={credit} invoices={invoices} showToast={showToast} />
        )}
        {currentRoute === 'warehouse-logistics' && (
          <WarehouseLogisticsPage inventory={inventory} orders={orders} showToast={showToast} />
        )}
      </main>

      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <i className="fa-solid fa-circle-check gold-text"></i> {toastMessage}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
