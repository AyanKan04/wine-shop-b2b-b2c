const { Pool } = require('pg');
const { seedIfEmpty } = require('./dbSeeder');

// Neon DB requires SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

let isConnected = false;

const getPool = async () => {
  if (!isConnected) {
    await connectDB();
  }
  return pool;
};

// Establish connection to PostgreSQL & Sync DB State
async function connectDB() {
  try {
    console.log('Connecting to PostgreSQL (Neon DB)...');
    
    // Test connection
    const client = await pool.connect();
    isConnected = true;
    console.log('SUCCESSFULLY connected to PostgreSQL database');

    // 1. Create LCDocuments table if it does not exist (PostgreSQL syntax)
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS LCDocuments (
          LCID SERIAL PRIMARY KEY,
          BuyerCompany VARCHAR(255) NOT NULL,
          LCNumber VARCHAR(100) NOT NULL,
          IssuingBank VARCHAR(255) NOT NULL,
          Amount DECIMAL(18,2) NOT NULL,
          ExpiryDate DATE NOT NULL,
          DocumentUrl VARCHAR(500) NOT NULL,
          Status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
          CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('LCDocuments table checked/created successfully.');
    } catch (lcTableErr) {
      console.error('Failed to create tables:', lcTableErr.message);
    } finally {
      client.release();
    }

    // 3. Seed database if empty
    // await seedIfEmpty(pool);

  } catch (err) {
    console.error('DATABASE connection failed:', err.message);
  }
}

// Start database connection
connectDB();

module.exports = {
  pool,
  getPool
};
