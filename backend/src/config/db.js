// Database Configuration & In-Memory Fallback Engine for RuuBusiness B2B/B2C Platform
const { Pool } = require('pg');
const sql = require('mssql');

let pgPool = null;

if (process.env.DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'RuuBusiness@2026',
  database: process.env.DB_NAME || 'RuuBusinessDB',
  server: process.env.DB_SERVER || 'localhost',
  options: {
    encrypt: true, 
    trustServerCertificate: true
  }
};

let mssqlPool = null;

const connectDB = async () => {
  try {
    const pool = await sql.connect(sqlConfig);
    console.log('Connected to SQL Server successfully');
    return pool;
  } catch (err) {
    console.error('Database Connection Failed! Bad Config: ', err);
    throw err;
  }
};

const getPool = async () => {
  if (!mssqlPool) {
    mssqlPool = await connectDB();
  }
  return mssqlPool;
};

// In-Memory Fallback Database Store (Used when PostgreSQL is not configured)
const dbMock = {
  companies: [
    {
      company_id: 1,
      company_code: 'COMP-LOTTE',
      company_name: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      tax_code: '0301234567',
      company_type: 'BUYER',
      status: 'ACTIVE',
      website: 'lottesaigon.com',
      created_at: '2026-01-10'
    },
    {
      company_id: 2,
      company_code: 'COMP-REDAPRON',
      company_name: 'MAISON DE L\'ALCOOL RED APRON FACTORY',
      tax_code: '0109876543',
      company_type: 'SELLER',
      status: 'ACTIVE',
      website: 'redapron.vn',
      created_at: '2025-11-20'
    }
  ],

  licenses: [
    {
      license_id: 1,
      company_id: 1,
      company_name: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      license_type: 'Giấy phép Bán buôn & Phân phối Rượu',
      license_number: '108/GP-BCT',
      issue_date: '2022-03-14',
      expiry_date: '2027-03-14',
      document_url: '/uploads/license_lotte_saigon.pdf',
      status: 'VERIFIED'
    },
    {
      license_id: 2,
      company_id: 3,
      company_name: 'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL',
      license_type: 'Giấy phép Bán buôn Rượu',
      license_number: '245/GP-SCT',
      issue_date: '2024-05-10',
      expiry_date: '2026-11-10',
      document_url: '/uploads/license_continental.pdf',
      status: 'PENDING_VERIFICATION'
    }
  ],

  products: [
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
      vintage_year: 2015,
      alcohol_content: 40.0,
      volume_ml: 700,
      moq: 6,
      image_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
      description: "Dòng Cognac X.O trứ danh nguyên bản từ năm 1870, phối trộn hơn 100 loại eaux-de-vie lâu năm.",
      tier_prices: [
        { tier_level: 1, min_quantity: 6, price_per_unit: 65000000 },
        { tier_level: 2, min_quantity: 20, price_per_unit: 60000000 },
        { tier_level: 3, min_quantity: 50, price_per_unit: 54000000 },
        { tier_level: 4, min_quantity: 100, price_per_unit: 50000000 },
        { tier_level: 5, min_quantity: 200, price_per_unit: 46000000 }
      ]
    }
  ],

  rfqs: [
    {
      rfq_id: 8842,
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      title: 'Đơn đàm phán rượu Macallan 18 sự kiện Tết 2027',
      product_name: 'Macallan 18 Year Old Sherry Oak Single Malt',
      quantity: 150,
      target_price: 68000000,
      status: 'SUBMITTED',
      created_at: '2026-07-20'
    }
  ],

  quotations: [
    {
      quotation_id: 9910,
      rfq_id: 8842,
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      seller_company: 'MAISON DE L\'ALCOOL RED APRON FACTORY',
      offer_unit_price: 68500000,
      quantity: 150,
      valid_until: '2026-08-20',
      status: 'PENDING'
    }
  ],

  orders: [
    {
      order_id: 501,
      order_number: 'ORD-2026-8821',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      total_amount: 200000000,
      order_status: 'DELIVERED',
      payment_method: 'NET_30_CREDIT',
      payment_status: 'PAID',
      created_at: '2026-07-15'
    },
    {
      order_id: 502,
      order_number: 'ORD-2026-8842',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      total_amount: 150000000,
      order_status: 'SHIPPING',
      payment_method: 'NET_30_CREDIT',
      payment_status: 'UNPAID',
      created_at: '2026-07-20'
    }
  ],

  credit_limit: {
    total_limit: 1000000000,
    used_amount: 350000000,
    available_balance: 650000000
  },

  invoices: [
    {
      invoice_id: 91,
      invoice_number: 'INV-2026-0091',
      order_number: 'ORD-2026-8821',
      issue_date: '2026-07-15',
      due_date: '2026-08-15',
      amount: 200000000,
      status: 'PAID'
    },
    {
      invoice_id: 104,
      invoice_number: 'INV-2026-0104',
      order_number: 'ORD-2026-8842',
      issue_date: '2026-07-20',
      due_date: '2026-08-20',
      amount: 150000000,
      status: 'UNPAID'
    }
  ],

  lc_documents: [
    {
      lc_id: 1,
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      lc_number: 'LC-HSBC-2026-0001',
      issuing_bank: 'HSBC Việt Nam',
      amount: 1500000000,
      expiry_date: '2026-12-31',
      document_url: '/uploads/lc_lotte_hsbc.pdf',
      status: 'VERIFIED',
      created_at: '2026-07-25'
    }
  ],

  inventory: [
    { product_id: 101, sku: 'SKU-SCOT-MAC18', product_name: 'Macallan 18 Year Old Sherry Oak Single Malt', stock_on_hand: 450, reserved: 150, min_stock_level: 50, location: 'Kho A1 - Quận 7' },
    { product_id: 102, sku: 'SKU-FR-MARGAUX2018', product_name: 'Château Margaux Premier Grand Cru Classé 2018', stock_on_hand: 280, reserved: 50, min_stock_level: 30, location: 'Kho A1 - Quận 7' },
    { product_id: 103, sku: 'SKU-FR-DOM2012', product_name: 'Dom Pérignon Vintage Brut Champagne 2012', stock_on_hand: 600, reserved: 80, min_stock_level: 60, location: 'Kho B2 - Quận 2' },
    { product_id: 104, sku: 'SKU-FR-HENNESSY-XO', product_name: 'Hennessy X.O Cognac Extra Old Edition', stock_on_hand: 320, reserved: 40, min_stock_level: 40, location: 'Kho B2 - Quận 2' }
  ],

  shipments: [
    {
      shipment_id: 1,
      order_id: 501,
      order_number: 'ORD-2026-8821',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      tracking_number: 'VN-SHIP-20260715-001',
      carrier: 'Giao Hàng Nhanh (GHN)',
      shipment_status: 'DELIVERED',
      items_summary: 'Macallan 18 x 20 thùng',
      pickup_date: '2026-07-15',
      estimated_delivery: '2026-07-17',
      actual_delivery: '2026-07-16',
      delivery_note_url: '/uploads/delivery_note_501.pdf',
      created_at: '2026-07-15'
    },
    {
      shipment_id: 2,
      order_id: 502,
      order_number: 'ORD-2026-8842',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      tracking_number: 'VN-SHIP-20260720-002',
      carrier: 'J&T Express',
      shipment_status: 'IN_TRANSIT',
      items_summary: 'Château Margaux x 10 thùng, Dom Pérignon x 15 thùng',
      pickup_date: '2026-07-20',
      estimated_delivery: '2026-07-23',
      actual_delivery: null,
      delivery_note_url: null,
      created_at: '2026-07-20'
    },
    {
      shipment_id: 3,
      order_id: null,
      order_number: null,
      buyer_company: 'TẬP ĐOÀN DỊCH VỤ ẨM THỰC RED CHILI',
      tracking_number: null,
      carrier: null,
      shipment_status: 'PICKING',
      items_summary: 'Dom Pérignon x 80 thùng',
      pickup_date: null,
      estimated_delivery: '2026-07-30',
      actual_delivery: null,
      delivery_note_url: null,
      created_at: '2026-07-22'
    }
  ],

  activity_logs: [
    { id: 'ACT-001', timestamp: '2026-07-28 20:25', module: 'CRM', action: 'Chuyển DEAL-101 sang Đang Đàm Phán', actor: 'Sales Admin', icon: 'fa-square-kanban', color: '#F59E0B' },
    { id: 'ACT-002', timestamp: '2026-07-28 19:40', module: 'Finance', action: 'Thanh toán hóa đơn INV-2026-0091 thành công', actor: 'Kế Toán', icon: 'fa-receipt', color: '#10B981' },
    { id: 'ACT-003', timestamp: '2026-07-28 18:15', module: 'Warehouse', action: 'Xuất kho 20 thùng Macallan 18 cho ORD-2026-8821', actor: 'Warehouse Staff', icon: 'fa-boxes-stacked', color: '#3B82F6' },
    { id: 'ACT-004', timestamp: '2026-07-28 17:00', module: 'Admin', action: 'Phê duyệt giấy phép rượu LIC-001 cho LOTTE SAIGON', actor: 'Platform Admin', icon: 'fa-shield-halved', color: '#E54D60' },
    { id: 'ACT-005', timestamp: '2026-07-28 15:30', module: 'CRM', action: 'Tạo cơ hội B2B mới DEAL-106 từ CONTINENTAL', actor: 'Sales Rep', icon: 'fa-handshake', color: '#8B5CF6' },
    { id: 'ACT-006', timestamp: '2026-07-28 14:00', module: 'Sales', action: 'Cập nhật Tier Price Macallan 18 - Giảm 5% Tier 3', actor: 'Sales Manager', icon: 'fa-tags', color: '#D4AF37' },
    { id: 'ACT-007', timestamp: '2026-07-27 22:00', module: 'System', action: 'Backup dữ liệu hệ thống tự động hoàn tất', actor: 'System Worker', icon: 'fa-server', color: '#6B7280' },
    { id: 'ACT-008', timestamp: '2026-07-27 16:30', module: 'Warehouse', action: 'Nhập kho 100 thùng Hennessy X.O từ nhà cung cấp', actor: 'Warehouse Staff', icon: 'fa-truck-ramp-box', color: '#3B82F6' }
  ],

  notifications: [
    { id: 'NOTIF-001', type: 'warning', title: 'Hóa đơn sắp đến hạn', message: 'INV-2026-0104 đến hạn ngày 20/08/2026 (còn 23 ngày)', read: false, timestamp: '2026-07-28 20:00' },
    { id: 'NOTIF-002', type: 'info', title: 'RFQ mới từ CONTINENTAL', message: 'Yêu cầu báo giá 40 thùng Château Margaux 2018', read: false, timestamp: '2026-07-28 19:30' },
    { id: 'NOTIF-003', type: 'success', title: 'Giao hàng thành công', message: 'ORD-2026-8821 đã giao thành công đến LOTTE SAIGON', read: true, timestamp: '2026-07-28 16:00' },
    { id: 'NOTIF-004', type: 'warning', title: 'Tồn kho thấp', message: 'Château Margaux còn 230 thùng khả dụng (dưới ngưỡng cảnh báo)', read: false, timestamp: '2026-07-28 14:00' },
    { id: 'NOTIF-005', type: 'info', title: 'Giấy phép chờ duyệt', message: '2 hồ sơ giấy phép rượu B2B đang chờ phê duyệt', read: false, timestamp: '2026-07-28 10:00' }
  ],

  revenue_data: {
    monthly: [
      { month: 'T1', revenue: 8200000000, orders: 12 },
      { month: 'T2', revenue: 9500000000, orders: 15 },
      { month: 'T3', revenue: 7800000000, orders: 11 },
      { month: 'T4', revenue: 11200000000, orders: 18 },
      { month: 'T5', revenue: 13500000000, orders: 22 },
      { month: 'T6', revenue: 15800000000, orders: 25 },
      { month: 'T7', revenue: 18650000000, orders: 30 }
    ],
    top_products: [
      { name: 'Macallan 18', revenue: 6800000000, percentage: 36 },
      { name: 'Château Margaux', revenue: 4400000000, percentage: 24 },
      { name: 'Dom Pérignon', revenue: 3000000000, percentage: 16 },
      { name: 'Hennessy X.O', revenue: 2700000000, percentage: 14 },
      { name: 'Khác', revenue: 1750000000, percentage: 10 }
    ]
  },

  rfq_messages: [
    {
      message_id: 1,
      rfq_id: 8842,
      sender_name: 'Platform Sales Bot',
      sender_role: 'SYSTEM',
      message_text: 'Hệ thống đã nhận RFQ. Sommelier AI & Sales Rep đang kiểm tra thông tin hàng hóa.',
      created_at: '2026-07-28 20:30'
    }
  ]
};

module.exports = {
  pool: pgPool,
  dbMock,
  getPool
};
