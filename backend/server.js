// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const helmet = require('helmet');

// Import middleware
const { securityHeaders, apiLimiter, speedLimiter } = require('./middleware/security');
const { requestLogger } = require('./middleware/logging');
const sanitizeInput = require('./middleware/sanitize');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/usersRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analytics');
const crmRoutes = require('./routes/crm');
const mpesaRoutes = require('./routes/mpesa');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;

// ======================= SECURITY MIDDLEWARE =======================
app.use(securityHeaders);
app.use(compression());

// ======================= CORS CONFIGURATION =======================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://arts-ecommerce.vercel.app',
  'https://yourdomain.co.ke' // Add your production domain
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ======================= RATE LIMITING =======================
app.use(apiLimiter);
app.use(speedLimiter);

// ======================= BODY PARSING =======================
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// ======================= LOGGING & SANITIZATION =======================
app.use(requestLogger);
app.use(sanitizeInput);

// ======================= STATIC FILES =======================
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// ======================= HEALTH CHECK =======================
app.use('/health', healthRoutes);

// ======================= API ROUTES =======================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/mpesa', mpesaRoutes);

// ======================= ROOT ROUTE =======================
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Welcome to Arts E-commerce API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: 'https://github.com/kileldylan/arts_ecommerce'
  });
});

// ======================= 404 HANDLER =======================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ======================= ERROR HANDLER =======================
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Log to file or external service in production
  if (process.env.NODE_ENV === 'production') {
    // Here you could log to Sentry, LogRocket, etc.
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// ======================= GRACEFUL SHUTDOWN =======================
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// ======================= START SERVER =======================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Arts E-commerce API Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
  console.log(`📊 Database: Supabase`);
  console.log(`💾 Caching: ${process.env.REDIS_URL ? 'Redis Enabled' : 'Redis Disabled'}`);
  console.log('='.repeat(50) + '\n');
});

// Handle server errors
server.on('error', (error) => {
  console.error('💥 Server error:', error);
  process.exit(1);
});

module.exports = app;