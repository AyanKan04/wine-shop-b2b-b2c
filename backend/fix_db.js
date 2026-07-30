const { getPool, sql } = require('./src/config/db');

async function fixDB() {
    try {
        const pool = await getPool();
        await pool.query(`
            UPDATE CompanyLicenses 
            SET LicenseType = N'Giấy phép Bán buôn Rượu' 
            WHERE LicenseType LIKE 'Gi?y%' OR LicenseType LIKE 'Gi%'
        `);
        console.log("Fixed CompanyLicenses");
        
        const result = await pool.query("SELECT LicenseID, LicenseType FROM CompanyLicenses");
        console.dir(result.recordset);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
fixDB();
