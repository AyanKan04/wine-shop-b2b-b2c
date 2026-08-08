require('dotenv').config();
const { getPool } = require('./src/config/db');

async function run() {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const rfqResult = await client.query(`
          INSERT INTO rfqs (buyer_company_id, created_by, title, description, status, created_at)
          VALUES ($1, $2, $3, $4, 'SUBMITTED', CURRENT_TIMESTAMP)
          RETURNING rfq_id, created_at
        `, [1, 5, 'Yêu cầu báo giá Test', 'Sản phẩm rượu Test']);

      const newId = rfqResult.rows[0].rfq_id;
      const createdAt = rfqResult.rows[0].created_at;

      await client.query(`
          INSERT INTO rfq_items (rfq_id, product_id, quantity, target_price)
          VALUES ($1, $2, $3, $4)
        `, [newId, 101, 50, 70000000]);

      await client.query('COMMIT');
      console.log('Success!', newId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating RFQ:', err);
  }
}
run();
