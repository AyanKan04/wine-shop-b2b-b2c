require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSeeds() {
  try {
    const client = await pool.connect();
    console.log("Connected to Neon DB. Running seed scripts...");
    
    const seedPlatformAdmin = path.join(__dirname, '../database/seed_platform_admin.sql');
    const sqlAdmin = fs.readFileSync(seedPlatformAdmin, 'utf8');
    await client.query(sqlAdmin);
    console.log("Platform admin seeded.");

    const seedMockProducts = path.join(__dirname, '../database/seed_mock_products.sql');
    const sqlProducts = fs.readFileSync(seedMockProducts, 'utf8');
    await client.query(sqlProducts);
    console.log("Mock products seeded.");

    client.release();
    process.exit(0);
  } catch (error) {
    console.error("Error applying seeds:", error);
    process.exit(1);
  }
}

runSeeds();
