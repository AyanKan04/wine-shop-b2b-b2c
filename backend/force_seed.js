const { getPool, sql } = require('./src/config/db');
const { seedIfEmpty } = require('./src/config/dbSeeder');

async function run() {
  console.log('Establishing connection to database...');
  await getPool();
  
  console.log('Starting forced database seed...');
  await seedIfEmpty(sql, true);
  
  process.exit(0);
}

run().catch(err => {
  console.error('Forced seeding failed:', err);
  process.exit(1);
});
