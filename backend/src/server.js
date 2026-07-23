const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const companyRoutes = require('./routes/companyRoutes');
const rfqRoutes = require('./routes/rfqRoutes');
const financeRoutes = require('./routes/financeRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', companyRoutes);
app.use('/api', rfqRoutes);
app.use('/api', financeRoutes);
app.use('/api', warehouseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'RuuBusiness Express API Running Smoothly', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`RuuBusiness Express API Server running on port ${PORT}`);
});
