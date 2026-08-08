require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const client = await pool.connect();
    
    // Read SQL
    let sql = fs.readFileSync(path.join(__dirname, '../database/seed_b2b_data.sql'), 'utf8');
    
    // Hash password to be safe
    const hash = bcrypt.hashSync('Password123!', 10);
    sql = sql.replace(/\$2a\$10\$wTfO3y6w\.x69\.X1DqB5E\/um2d0QJ4d91u6nXZH5l\.9oQ4aD1k5j3C/g, hash);
    
    await client.query(sql);
    console.log("B2B Mock Data seeded successfully!");
    
    // Check users
    const res = await client.query('SELECT username FROM users');
    console.log("Current users in DB:", res.rows.map(r => r.username));
    
    client.release();
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
