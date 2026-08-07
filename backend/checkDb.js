const sql = require('mssql');
const dbConfig = {
  user: 'sa',
  password: 'YourStrongPassword123!',
  server: 'localhost',
  database: 'RuuBusinessDB',
  options: { trustServerCertificate: true }
};
sql.connect(dbConfig).then(pool => pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AuditLogs'").then(r => { console.log(r.recordset); process.exit(0); })).catch(console.error);
