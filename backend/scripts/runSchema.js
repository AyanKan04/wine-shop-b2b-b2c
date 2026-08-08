require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSchema() {
  try {
    const client = await pool.connect();
    console.log("Connected to Neon DB. Running schema.sql...");
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the SQL schema
    await client.query(sql);
    console.log("Schema applied successfully.");
    client.release();
    process.exit(0);
  } catch (error) {
    console.error("Error applying schema:", error);
    process.exit(1);
  }
}

runSchema();
