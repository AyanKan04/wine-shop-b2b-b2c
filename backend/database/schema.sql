-- ==============================================================================
-- POSTGRESQL DATABASE SCHEMA - B2B ALCOHOL E-COMMERCE (RUUBUSINESS)
-- ==============================================================================

-- 1. IDENTITY & ACCESS MANAGEMENT
CREATE TABLE IF NOT EXISTS companies (
    company_id BIGSERIAL PRIMARY KEY,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(50) UNIQUE NOT NULL,
    business_registration_number VARCHAR(100),
    company_type VARCHAR(50) CHECK (company_type IN ('BUYER', 'SELLER', 'LOGISTICS')),
    tier_level VARCHAR(20) DEFAULT 'STANDARD', 
    website VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(company_id) ON DELETE SET NULL, 
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(50),
    user_type VARCHAR(50) CHECK (user_type IN ('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'BUYER_REP', 'SALES_REP', 'FINANCE_OFFICER', 'WAREHOUSE_STAFF')),
    status VARCHAR(50) DEFAULT 'ACTIVE', 
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. COMPLIANCE & ALCOHOL LICENSING
CREATE TABLE IF NOT EXISTS company_licenses (
    license_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(company_id) ON DELETE CASCADE,
    license_type VARCHAR(100), 
    license_number VARCHAR(100) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    document_url VARCHAR(500), 
    status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION' 
);

-- 3. PRODUCT CATALOG (RED APRON FINE WINES & SPIRITS)
CREATE TABLE IF NOT EXISTS brands (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    parent_category_id INT REFERENCES categories(category_id),
    category_name VARCHAR(100) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    product_id BIGSERIAL PRIMARY KEY,
    seller_company_id BIGINT REFERENCES companies(company_id), 
    brand_id INT REFERENCES brands(brand_id),
    category_id INT REFERENCES categories(category_id),
    sku VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    country_of_origin VARCHAR(100), 
    region VARCHAR(100),
    grape_variety VARCHAR(100),
    vintage_year INT,
    alcohol_content DECIMAL(5,2), 
    volume_ml INT, 
    moq INT DEFAULT 1, 
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'ACTIVE', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. B2B TIERED PRICING (TIER 1 TO TIER 5)
CREATE TABLE IF NOT EXISTS product_tier_prices (
    tier_price_id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(product_id) ON DELETE CASCADE,
    tier_level INT NOT NULL CHECK (tier_level BETWEEN 1 AND 5), 
    min_quantity INT NOT NULL, 
    price_per_unit DECIMAL(18,2) NOT NULL 
);

-- 5. RFQ & QUOTATION NEGOTIATION
CREATE TABLE IF NOT EXISTS rfqs (
    rfq_id BIGSERIAL PRIMARY KEY,
    buyer_company_id BIGINT REFERENCES companies(company_id),
    created_by BIGINT REFERENCES users(user_id), 
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rfq_items (
    rfq_item_id BIGSERIAL PRIMARY KEY,
    rfq_id BIGINT REFERENCES rfqs(rfq_id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(product_id),
    quantity INT NOT NULL,
    target_price DECIMAL(18,2)
);

CREATE TABLE IF NOT EXISTS quotations (
    quotation_id BIGSERIAL PRIMARY KEY,
    rfq_id BIGINT REFERENCES rfqs(rfq_id), 
    buyer_company_id BIGINT REFERENCES companies(company_id),
    seller_company_id BIGINT REFERENCES companies(company_id),
    created_by BIGINT REFERENCES users(user_id), 
    status VARCHAR(50) DEFAULT 'PENDING', 
    valid_until TIMESTAMP NOT NULL,
    total_offered_amount DECIMAL(18,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_items (
    quotation_item_id BIGSERIAL PRIMARY KEY,
    quotation_id BIGINT REFERENCES quotations(quotation_id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(product_id),
    quantity INT NOT NULL,
    offer_unit_price DECIMAL(18,2) NOT NULL 
);

-- 6. ORDER & INVENTORY MANAGEMENT
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGSERIAL PRIMARY KEY,
    buyer_company_id BIGINT REFERENCES companies(company_id),
    seller_company_id BIGINT REFERENCES companies(company_id),
    quotation_id BIGINT REFERENCES quotations(quotation_id), 
    order_number VARCHAR(100) UNIQUE NOT NULL,
    order_status VARCHAR(50) DEFAULT 'PENDING', 
    payment_method VARCHAR(50), 
    total_amount DECIMAL(18,2) NOT NULL,
    created_by BIGINT REFERENCES users(user_id), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL
);

-- 7. FINANCIAL CREDIT & INVOICES
CREATE TABLE IF NOT EXISTS credit_limits (
    credit_limit_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT UNIQUE REFERENCES companies(company_id), 
    credit_limit_amount DECIMAL(18,2) NOT NULL, 
    used_amount DECIMAL(18,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(order_id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE, 
    status VARCHAR(50) DEFAULT 'UNPAID',
    amount DECIMAL(18,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventories (
    inventory_id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(product_id),
    quantity_on_hand INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shipments (
    shipment_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(order_id),
    tracking_number VARCHAR(100),
    shipment_status VARCHAR(50) DEFAULT 'PICKING',
    delivery_note_url VARCHAR(500),
    estimated_delivery_date TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS ix_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS ix_categories_slug ON categories(slug);
