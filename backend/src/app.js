require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const companyRoutes = require('./routes/companyRoutes');
const rfqRoutes = require('./routes/rfqRoutes');
const financeRoutes = require('./routes/financeRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const testRoutes = require('./routes/testRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Security HTTP Headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration for production readiness
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Origin not allowed'));
    }
  },
  credentials: true
}));

// Rate Limiter for Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Thao tác quá nhiều lần từ IP này. Vui lòng thử lại sau 15 phút.' }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoints (Unprotected)
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'RuuBusiness Express API Running Smoothly', timestamp: new Date() });
});

app.get('/api', (req, res) => {
  res.json({ success: true, status: 'RuuBusiness Express API Active', health: '/api/health', timestamp: new Date() });
});

// API Modular Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api', companyRoutes);
app.use('/api', rfqRoutes);
app.use('/api', financeRoutes);
app.use('/api', warehouseRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test', testRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.'
      : err.message
  });
});

module.exports = app;

