const { getPool } = require('./src/config/db');

async function test() {
  const pool = await getPool();
  const res = await pool.request().query('SELECT * FROM Products WHERE ProductID = 8');
  console.log("Product 8:", res.recordset);
  process.exit(0);
}
test().catch(console.error);
