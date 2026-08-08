require('dotenv').config();
const { getPool } = require('../src/config/db');

async function alterInvoices() {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      console.log('Altering invoices table...');
      await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(18,2) DEFAULT 0`);
      
      // Migrate existing paid amount from payments table if any
      await client.query(`
        UPDATE invoices i
        SET paid_amount = COALESCE((
          SELECT SUM(amount) FROM payments p WHERE p.invoice_id = i.invoice_id
        ), 0)
      `);
      
      console.log('Successfully altered invoices and migrated paid_amount.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  }
}
alterInvoices();
