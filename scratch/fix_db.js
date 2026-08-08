const { getPool } = require('../backend/src/config/db');

async function fix() {
  const pool = await getPool();
  await pool.query("UPDATE users SET user_type = 'COMPANY_ADMIN' WHERE username = 'admin_user'");
  console.log('Updated admin_user to COMPANY_ADMIN');
  process.exit(0);
}

fix();
