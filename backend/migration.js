require('dotenv').config();
const { getPool } = require('./src/config/db');

async function runMigration() {
  const pool = await getPool();
  try {
    await pool.query(`
      ALTER TABLE shipments 
      ADD COLUMN IF NOT EXISTS buyer_company VARCHAR(255),
      ADD COLUMN IF NOT EXISTS carrier VARCHAR(255),
      ADD COLUMN IF NOT EXISTS items_summary TEXT;
    `);
    console.log("Migration successful");
    process.exit(0);
  } catch(e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}
runMigration();
