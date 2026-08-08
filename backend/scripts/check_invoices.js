require('dotenv').config();
const { getPool } = require('../src/config/db');

async function checkInvoices() {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'invoices'
      `);
      console.log('Columns in invoices table:');
      console.table(res.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  }
}
checkInvoices();
