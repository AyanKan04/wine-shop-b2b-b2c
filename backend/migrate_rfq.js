const { Pool } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('./.env', 'utf8');
const dbUrl = envFile.match(/DATABASE_URL=(.*)/)[1].trim();

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE rfqs 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS suggested_product_ids JSON;
    `);
    console.log('Added rejection_reason and suggested_product_ids to rfqs.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rfq_messages (
        message_id BIGSERIAL PRIMARY KEY,
        rfq_id BIGINT NOT NULL,
        sender_id BIGINT,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        message_text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured rfq_messages exists.');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
