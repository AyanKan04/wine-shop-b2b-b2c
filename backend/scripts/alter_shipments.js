require('dotenv').config();
const { getPool } = require('../src/config/db');

async function alterShipments() {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      console.log('Altering shipments table...');
      await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS buyer_company VARCHAR(255)`);
      await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS carrier VARCHAR(100)`);
      await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS items_summary TEXT`);
      
      console.log('Successfully altered shipments.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  }
}
alterShipments();
