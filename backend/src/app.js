const express = require('express');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const companyRoutes = require('./routes/companyRoutes');
const rfqRoutes = require('./routes/rfqRoutes');
const financeRoutes = require('./routes/financeRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

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

module.exports = app;
