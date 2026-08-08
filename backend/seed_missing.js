require('dotenv').config();
const { getPool } = require('./src/config/db');

async function run() {
  const pool = await getPool();
  try {
    const cats = ['Whisky', 'Cognac'];
    for (const c of cats) {
      const slug = c.toLowerCase().replace(/ /g, '-').replace(/\//g, '-');
      await pool.query(`
        INSERT INTO categories (category_name, slug) 
        VALUES ($1, $2)
        ON CONFLICT (slug) DO NOTHING;
      `, [c, slug]);
    }
    console.log("Missing categories seeded!");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
