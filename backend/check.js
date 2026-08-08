require('dotenv').config();
const { getPool } = require('./src/config/db');

async function testQuery() {
  const pool = await getPool();
  try {
    const res = await pool.query('SELECT * FROM categories');
    console.log("Categories:", res.rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
testQuery();
