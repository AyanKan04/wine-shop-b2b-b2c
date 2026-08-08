require('dotenv').config();
const { getPool } = require('../src/config/db');

async function resetAccount() {
  try {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      console.log('Finding Chương Rượu...');
      const compRes = await client.query(`SELECT company_id, company_name FROM companies WHERE company_name ILIKE '%Chương Rượu%'`);
      if (compRes.rows.length > 0) {
        const companyId = compRes.rows[0].company_id;
        console.log(`Found company ${compRes.rows[0].company_name} with ID ${companyId}`);
        
        await client.query(`UPDATE companies SET status = 'PENDING' WHERE company_id = $1`, [companyId]);
        await client.query(`UPDATE users SET status = 'PENDING' WHERE company_id = $1`, [companyId]);
        console.log('Successfully set company and users to PENDING.');
      } else {
        console.log('Could not find company Chương Rượu');
      }
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
  }
}
resetAccount();
