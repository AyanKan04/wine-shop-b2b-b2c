const { getPool } = require('./src/config/db');

async function updateImages() {
  const pool = await getPool();
  
  await pool.request().query(`
    UPDATE Products SET ImageURL = 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80' WHERE ProductID = 101;
    UPDATE Products SET ImageURL = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80' WHERE ProductID = 102;
    UPDATE Products SET ImageURL = 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80' WHERE ProductID = 103;
    UPDATE Products SET ImageURL = 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=800&q=80' WHERE ProductID = 104;
  `);

  console.log('✅ Đã cập nhật 100% hình ảnh sản phẩm trong SQL Server Database!');
  process.exit(0);
}

updateImages().catch(err => {
  console.error(err);
  process.exit(1);
});
