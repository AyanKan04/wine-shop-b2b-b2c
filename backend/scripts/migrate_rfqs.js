require('dotenv').config();
const { getPool } = require('../src/config/db');

async function migrateRFQs() {
  let pool;
  try {
    pool = await getPool();
    console.log('Connected to database. Running RFQ migration...');

    // Add column if it doesn't exist
    await pool.query(`
      ALTER TABLE rfqs 
      ADD COLUMN IF NOT EXISTS seller_company_id BIGINT REFERENCES companies(company_id);
    `);
    console.log('Added seller_company_id column to rfqs table (if it did not exist).');

    // Update existing records to point to company 1 (default seller)
    const result = await pool.query(`
      UPDATE rfqs 
      SET seller_company_id = 1 
      WHERE seller_company_id IS NULL;
    `);
    console.log(`Updated ${result.rowCount} existing RFQs to have seller_company_id = 1.`);

    console.log('RFQ migration completed successfully.');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    if (pool) {
      process.exit(0);
    }
  }
}

migrateRFQs();
