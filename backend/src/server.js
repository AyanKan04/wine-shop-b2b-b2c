const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RuuBusiness Express API Server running on port ${PORT}`);
});
