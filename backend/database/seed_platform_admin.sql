-- ==============================================================================
-- SEED DATA: PLATFORM ADMIN ACCOUNT (POSTGRESQL)
-- ==============================================================================

INSERT INTO users (email, username, password_hash, first_name, last_name, user_type, status)
VALUES (
    'admin@ruubusiness.vn',
    'admin_platform',
    '$2b$10$Gawe2obY6IAwsDyo1liw8.FqhgeoE9ahnQQD5q6Oygyh3vHnE1e2m', -- Admin@123!
    'System',
    'Admin',
    'PLATFORM_ADMIN',
    'ACTIVE'
)
ON CONFLICT (email) DO NOTHING;

-- PRINT is not available directly in pure PostgreSQL without PL/pgSQL, using a notice inside a DO block is an alternative, or simply returning nothing.
DO $$ 
BEGIN 
   RAISE NOTICE 'Platform Admin account checked/created successfully. (Username: admin_platform / Password: Admin@123!)'; 
END $$;
