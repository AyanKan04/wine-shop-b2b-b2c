require('dotenv').config();
const { getPool } = require('./src/config/db');

async function testPayment() {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const invId = 1; // Assuming 1 exists
      const payVal = 500000000;
      const payMethod = 'CASH';
      const payRef = 'FT12345';
      
      console.log('Inserting into payments...');
      await client.query(`
          INSERT INTO payments (invoice_id, amount, paid_amount, payment_method, payment_reference, paid_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [invId, payVal, payVal, payMethod, payRef]);

      console.log('Updating invoices...');
      const invUpdateRes = await client.query(`
          UPDATE invoices 
          SET paid_amount = COALESCE(paid_amount, 0) + $1, status = CASE WHEN (COALESCE(paid_amount, 0) + $1) >= amount THEN 'PAID' ELSE 'PARTIALLY_PAID' END
          WHERE invoice_id = $2 AND (amount - COALESCE(paid_amount, 0)) >= $1
        `, [payVal, invId]);

      console.log('Update invoices result:', invUpdateRes.rowCount);

      await client.query('ROLLBACK');
      console.log('Test completed successfully (rolled back).');
    } catch (err) {
      console.error('SQL Error:', err);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Connection Error:', err);
  }
}
testPayment();
