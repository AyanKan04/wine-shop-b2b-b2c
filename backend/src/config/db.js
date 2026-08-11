const { Pool } = require('pg');
const { seedIfEmpty } = require('./dbSeeder');

// Neon DB requires SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
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
        CREATE TABLE IF NOT EXISTS lc_documents (
          lc_id SERIAL PRIMARY KEY,
          buyer_company VARCHAR(255) NOT NULL,
          lc_number VARCHAR(100) NOT NULL,
          issuing_bank VARCHAR(255) NOT NULL,
          amount DECIMAL(18,2) NOT NULL,
          expiry_date DATE NOT NULL,
          document_url VARCHAR(500) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('lc_documents table checked/created successfully.');

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
