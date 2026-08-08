DO $$ 
DECLARE
    -- No variables needed for this basic seed, using hardcoded IDs is fine since we truncate
BEGIN

    -- Truncate existing test data to ensure clean slate (cascade deletes dependencies)
    TRUNCATE TABLE companies, users, company_licenses, contracts, contract_prices CASCADE;

    -- 1. Companies
    INSERT INTO companies (company_id, company_code, company_name, tax_code, company_type, status, website)
    VALUES 
    (1, 'COMP-LOTTE', 'CÔNG TY CP KHÁCH SẠN LOTTE SAIGON', '0301234567', 'BUYER', 'ACTIVE', 'lottesaigon.com'),
    (2, 'COMP-REDAPRON', 'MAISON DE L''ALCOOL RED APRON FACTORY', '0109876543', 'SELLER', 'ACTIVE', 'redapron.vn'),
    (3, 'COMP-CONTINENTAL', 'CÔNG TY TNHH KHÁCH SẠN CONTINENTAL', '0309999111', 'BUYER', 'ACTIVE', 'continental.vn'),
    (4, 'COMP-FURAMA', 'CÔNG TY CP KHÁCH SẠN FURAMA ĐÀ NẴNG', '0400123456', 'BUYER', 'ACTIVE', 'furamadanang.com'),
    (5, 'COMP-SAIGONCOOP', 'LIÊN HIỆP HTX THƯƠNG MẠI TP.HCM - SAIGON CO.OP', '0300888999', 'BUYER', 'ACTIVE', 'saigoncoop.vn'),
    (6, 'COMP-DALATWINE', 'NHÀ MÁY VANG ĐÀ LẠT - DALAT WINE JSC', '5800111222', 'SELLER', 'ACTIVE', 'dalatwine.vn')
    ON CONFLICT (company_id) DO NOTHING;

    -- 2. Users (B2B Test Accounts) - password is Password123!
    INSERT INTO users (user_id, company_id, email, username, password_hash, first_name, last_name, user_type, status)
    VALUES 
    (2, 2, 'admin@redapron.vn', 'admin_user', '$2a$10$wTfO3y6w.x69.X1DqB5E/um2d0QJ4d91u6nXZH5l.9oQ4aD1k5j3C', 'Tran', 'Admin', 'COMPANY_ADMIN', 'ACTIVE'),
    (3, 2, 'seller@redapron.vn', 'seller_user', '$2a$10$wTfO3y6w.x69.X1DqB5E/um2d0QJ4d91u6nXZH5l.9oQ4aD1k5j3C', 'Le', 'Seller', 'SALES_REP', 'ACTIVE'),
    (4, 2, 'accountant@redapron.vn', 'ketoan_user', '$2a$10$wTfO3y6w.x69.X1DqB5E/um2d0QJ4d91u6nXZH5l.9oQ4aD1k5j3C', 'Pham', 'Accountant', 'FINANCE_OFFICER', 'ACTIVE'),
    (5, 1, 'purchasing@lottesaigon.com', 'lotte_buyer', '$2a$10$wTfO3y6w.x69.X1DqB5E/um2d0QJ4d91u6nXZH5l.9oQ4aD1k5j3C', 'Nguyen', 'Buyer Lotte', 'BUYER_REP', 'ACTIVE'),
    (6, 3, 'procurement@continental.vn', 'continental_buyer', '$2a$10$wTfO3y6w.x69.X1DqB5E/um2d0QJ4d91u6nXZH5l.9oQ4aD1k5j3C', 'Tran', 'Buyer Conti', 'BUYER_REP', 'ACTIVE')
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. CompanyLicenses
    INSERT INTO company_licenses (license_id, company_id, license_type, license_number, issue_date, expiry_date, document_url, status)
    VALUES 
    (1, 2, 'WHOLESALE', 'WS-2023-001', '2023-01-01', '2028-01-01', '/docs/licenses/redapron_wholesale.pdf', 'VERIFIED'),
    (2, 1, 'RETAIL', 'RT-2022-105', '2022-06-15', '2027-06-15', '/docs/licenses/lotte_retail.pdf', 'VERIFIED')
    ON CONFLICT (license_id) DO NOTHING;

    -- Update sequences
    PERFORM setval('companies_company_id_seq', (SELECT MAX(company_id) FROM companies));
    PERFORM setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
    PERFORM setval('company_licenses_license_id_seq', (SELECT MAX(license_id) FROM company_licenses));

END $$;
