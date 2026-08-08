require('dotenv').config();
const { getPool } = require('../src/config/db');

async function seedInventories() {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      console.log('Seeding inventories...');
      const products = await client.query('SELECT product_id FROM products');
      
      let count = 0;
      for (const prod of products.rows) {
        const check = await client.query('SELECT * FROM inventories WHERE product_id = $1', [prod.product_id]);
        if (check.rows.length === 0) {
          await client.query(
            'INSERT INTO inventories (product_id, quantity_on_hand, reserved_quantity) VALUES ($1, 5000, 0)',
            [prod.product_id]
          );
          count++;
        } else {
          await client.query(
            'UPDATE inventories SET quantity_on_hand = 5000 WHERE product_id = $1',
            [prod.product_id]
          );
        }
      }
      
      // Also update credit limits for companies just in case they are missing!
      const companies = await client.query("SELECT company_id FROM companies WHERE company_type = 'BUYER'");
      for (const comp of companies.rows) {
        const creditCheck = await client.query('SELECT * FROM credit_limits WHERE company_id = $1', [comp.company_id]);
        if (creditCheck.rows.length === 0) {
          await client.query(
            'INSERT INTO credit_limits (company_id, credit_limit_amount, used_amount) VALUES ($1, 5000000000, 0)',
            [comp.company_id]
          );
        }
      }

      console.log(`Successfully seeded ${count} inventories and credit limits.`);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
  }
}
seedInventories();
