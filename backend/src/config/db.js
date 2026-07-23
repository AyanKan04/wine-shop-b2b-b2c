// Database Configuration & In-Memory Fallback Engine for RuuBusiness B2B/B2C Platform
const { Pool } = require('pg');

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

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
      created_at: '2026-07-15'
    },
    {
      order_id: 502,
      order_number: 'ORD-2026-8842',
      buyer_company: 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON',
      total_amount: 150000000,
      order_status: 'SHIPPING',
      payment_method: 'NET_30_CREDIT',
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

  inventory: [
    { product_id: 101, sku: 'SKU-SCOT-MAC18', stock_on_hand: 450, reserved: 150 },
    { product_id: 102, sku: 'SKU-FR-MARGAUX2018', stock_on_hand: 280, reserved: 50 },
    { product_id: 103, sku: 'SKU-FR-DOM2012', stock_on_hand: 600, reserved: 80 },
    { product_id: 104, sku: 'SKU-FR-HENNESSY-XO', stock_on_hand: 320, reserved: 40 }
  ]
};

module.exports = {
  pool,
  dbMock
};
