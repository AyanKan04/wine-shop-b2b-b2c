require('dotenv').config();
const { getPool } = require('../src/config/db');

async function fixAdminRole() {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      console.log('Fixing admin_user role...');
      const res = await client.query(`
        UPDATE users 
        SET user_type = 'PLATFORM_ADMIN' 
        WHERE username = 'admin_user'
      `);
      console.log(`Updated ${res.rowCount} row(s).`);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
  }
}
fixAdminRole();
