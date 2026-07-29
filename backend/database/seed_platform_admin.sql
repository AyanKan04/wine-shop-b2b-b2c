-- ==============================================================================
-- SEED DATA: PLATFORM ADMIN ACCOUNT
-- ==============================================================================

IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin_platform')
BEGIN
    INSERT INTO Users (Email, Username, PasswordHash, FirstName, LastName, UserType, Status)
    VALUES (
        'admin@ruubusiness.vn',
        'admin_platform',
        '$2b$10$Gawe2obY6IAwsDyo1liw8.FqhgeoE9ahnQQD5q6Oygyh3vHnE1e2m', -- Admin@123!
        'System',
        'Admin',
        'PLATFORM_ADMIN',
        'ACTIVE'
    );
END;
PRINT 'Platform Admin account created successfully. (Username: admin_platform / Password: Admin@123!)';
