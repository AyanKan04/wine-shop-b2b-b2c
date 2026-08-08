const bcrypt = require('bcryptjs');
const fs = require('fs');
const { Pool } = require('pg');

const envFile = fs.readFileSync('./.env', 'utf8');
const dbUrl = envFile.match(/DATABASE_URL=(.*)/)[1].trim();

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE username = 'admin_platform'", [hash]);
    console.log('Password reset to admin123');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
