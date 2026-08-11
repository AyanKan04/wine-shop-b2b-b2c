const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`RuuBusiness Express API Server running on port ${PORT}`);
});

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      if (pool) {
        await pool.end();
        console.log('Database pool connections closed.');
      }
    } catch (err) {
      console.error('Error closing DB pool:', err);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

