-- ==============================================================================
-- SEED DATA: MOCK PRODUCTS FOR B2B ALCOHOL E-COMMERCE (POSTGRESQL)
-- Run this script to insert mock products into the PostgreSQL database.
-- ==============================================================================

DO $$
DECLARE
    seller_id BIGINT;
    cat_whisky_id INT;
    cat_wine_id INT;
    cat_champagne_id INT;
    cat_cognac_id INT;
    p1 BIGINT;
    p2 BIGINT;
    p3 BIGINT;
    p4 BIGINT;
BEGIN
    -- 1. Insert Seller Company (if not exists)
    INSERT INTO companies (company_code, company_name, tax_code, company_type, status, website)
    VALUES ('COMP-REDAPRON', 'MAISON DE L''ALCOOL RED APRON FACTORY', '0109876543', 'SELLER', 'ACTIVE', 'redapron.vn')
    ON CONFLICT (company_code) DO NOTHING;

    SELECT company_id INTO seller_id FROM companies WHERE company_code = 'COMP-REDAPRON';

    -- 2. Insert Categories
    INSERT INTO categories (category_name, slug) VALUES ('Spirits / Whisky', 'spirits-whisky') ON CONFLICT (slug) DO NOTHING;
    INSERT INTO categories (category_name, slug) VALUES ('Fine Wine', 'fine-wine') ON CONFLICT (slug) DO NOTHING;
    INSERT INTO categories (category_name, slug) VALUES ('Champagne', 'champagne') ON CONFLICT (slug) DO NOTHING;
    INSERT INTO categories (category_name, slug) VALUES ('Cognac', 'cognac') ON CONFLICT (slug) DO NOTHING;

    SELECT category_id INTO cat_whisky_id FROM categories WHERE slug = 'spirits-whisky';
    SELECT category_id INTO cat_wine_id FROM categories WHERE slug = 'fine-wine';
    SELECT category_id INTO cat_champagne_id FROM categories WHERE slug = 'champagne';
    SELECT category_id INTO cat_cognac_id FROM categories WHERE slug = 'cognac';

    -- 3. Insert Products
    -- Product 1: Macallan 18
    INSERT INTO products (seller_company_id, category_id, sku, product_name, slug, description, country_of_origin, alcohol_content, volume_ml, moq, image_url)
    VALUES (
        seller_id, cat_whisky_id, 'SKU-SCOT-MAC18', 'Macallan 18 Year Old Sherry Oak Single Malt', 'macallan-18-sherry-oak',
        'Dòng Single Malt Whisky danh tiếng từ vùng Highland Scotland, ủ 18 năm trong thùng gỗ sồi Sherry Oak Tây Ban Nha.',
        'Scotland', 43.0, 700, 5, 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80'
    ) ON CONFLICT (sku) DO NOTHING;

    SELECT product_id INTO p1 FROM products WHERE sku = 'SKU-SCOT-MAC18';
    IF p1 IS NOT NULL THEN
        INSERT INTO product_tier_prices (product_id, tier_level, min_quantity, price_per_unit) VALUES
        (p1, 1, 5, 85000000), (p1, 2, 20, 78000000), (p1, 3, 50, 72500000), (p1, 4, 100, 68000000), (p1, 5, 200, 64000000)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Product 2: Château Margaux
    INSERT INTO products (seller_company_id, category_id, sku, product_name, slug, description, country_of_origin, alcohol_content, volume_ml, moq, image_url)
    VALUES (
        seller_id, cat_wine_id, 'SKU-FR-MARGAUX2018', 'Château Margaux Premier Grand Cru Classé 2018', 'chateau-margaux-2018',
        'Vang đỏ huyền thoại thuộc bảng xếp hạng Premier Grand Cru Classé 1855 trứ danh vùng Margaux Bordeaux.',
        'France', 13.5, 750, 10, 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?auto=format&fit=crop&w=800&q=80'
    ) ON CONFLICT (sku) DO NOTHING;

    SELECT product_id INTO p2 FROM products WHERE sku = 'SKU-FR-MARGAUX2018';
    IF p2 IS NOT NULL THEN
        INSERT INTO product_tier_prices (product_id, tier_level, min_quantity, price_per_unit) VALUES
        (p2, 1, 10, 120000000), (p2, 2, 30, 110000000), (p2, 3, 100, 98000000), (p2, 4, 250, 92000000), (p2, 5, 500, 85000000)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Product 3: Dom Pérignon
    INSERT INTO products (seller_company_id, category_id, sku, product_name, slug, description, country_of_origin, alcohol_content, volume_ml, moq, image_url)
    VALUES (
        seller_id, cat_champagne_id, 'SKU-FR-DOM2012', 'Dom Pérignon Vintage Brut Champagne 2012', 'dom-perignon-2012',
        'Tuyệt phẩm Sâm-panh Pháp niên hiệu 2012 đạt sự cân bằng tuyệt hảo giữa hương hoa quả nhiệt đới và khoáng chất.',
        'France', 12.5, 750, 8, 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80'
    ) ON CONFLICT (sku) DO NOTHING;

    SELECT product_id INTO p3 FROM products WHERE sku = 'SKU-FR-DOM2012';
    IF p3 IS NOT NULL THEN
        INSERT INTO product_tier_prices (product_id, tier_level, min_quantity, price_per_unit) VALUES
        (p3, 1, 8, 45000000), (p3, 2, 25, 41000000), (p3, 3, 75, 37500000), (p3, 4, 150, 34000000), (p3, 5, 300, 31000000)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Product 4: Hennessy X.O
    INSERT INTO products (seller_company_id, category_id, sku, product_name, slug, description, country_of_origin, alcohol_content, volume_ml, moq, image_url)
    VALUES (
        seller_id, cat_cognac_id, 'SKU-FR-HENNESSY-XO', 'Hennessy X.O Cognac Extra Old Edition', 'hennessy-xo',
        'Dòng Cognac X.O trứ danh nguyên bản từ năm 1870, phối trộn hơn 100 loại eaux-de-vie lâu năm.',
        'France', 40.0, 700, 6, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'
    ) ON CONFLICT (sku) DO NOTHING;

    SELECT product_id INTO p4 FROM products WHERE sku = 'SKU-FR-HENNESSY-XO';
    IF p4 IS NOT NULL THEN
        INSERT INTO product_tier_prices (product_id, tier_level, min_quantity, price_per_unit) VALUES
        (p4, 1, 6, 65000000), (p4, 2, 20, 60000000), (p4, 3, 50, 54000000), (p4, 4, 100, 50000000), (p4, 5, 200, 46000000)
        ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE 'Mock Products inserted successfully.';
END $$;
