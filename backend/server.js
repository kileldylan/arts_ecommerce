require('dotenv').config();

// Memory optimization - set at the very top
const v8 = require('v8');
v8.setFlagsFromString('--max-old-space-size=512');

// Log memory configuration
console.log('=== Memory Configuration ===');
console.log('Heap Size Limit:', Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024) + ' MB');
console.log('Node Flags: --max-old-space-size=512');
console.log('============================');

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
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/usersRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analytics');
const mpesaRoutes = require('./routes/mpesa');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;

// ======================= MEMORY MONITORING =======================
const startMemoryMonitoring = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log('=== Memory Monitor ===');
    console.log('RSS:', Math.round(memUsage.rss / 1024 / 1024) + ' MB');
    console.log('Heap Used:', Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB');
    console.log('Heap Total:', Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB');
    console.log('=====================');
  }, 300000); // Log every 5 minutes
};

// ======================= SECURITY MIDDLEWARE =======================
app.use(securityHeaders);
app.use(compression({ level: 6 })); // Balanced compression level

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

// ======================= BODY PARSING (OPTIMIZED) =======================
app.use(express.json({ 
  limit: '5mb', // Reduced from 10mb to save memory
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '5mb' // Reduced from 10mb
}));

// ======================= LOGGING & SANITIZATION =======================
// Only use detailed logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}
app.use(sanitizeInput);

// ======================= STATIC FILES =======================
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  // Optimize memory usage for static files
  cacheControl: true,
  lastModified: true
}));

// ======================= HEALTH CHECK =======================
app.use('/health', healthRoutes);

// ======================= API ROUTES =======================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
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

// ======================= MEMORY HEALTH CHECK =======================
app.get('/memory-health', (req, res) => {
  const memUsage = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();
  
  res.json({
    status: 'healthy',
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapLimit: Math.round(heapStats.heap_size_limit / 1024 / 1024) + ' MB'
    },
    uptime: Math.round(process.uptime()) + ' seconds',
    nodeVersion: process.version
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

  // Memory cleanup on error
  if (global.gc) {
    console.log('🔄 Triggering garbage collection due to error');
    global.gc();
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
const gracefulShutdown = () => {
  console.log('🛑 Shutdown signal received, shutting down gracefully');
  
  // Close server and cleanup
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.log('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ======================= START SERVER =======================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Arts E-commerce API Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
  console.log(`📊 Database: Supabase`);
  console.log(`💾 Caching: Memory Only (Redis Removed)`);
  console.log(`🧠 Memory Limit: 512MB`);
  console.log('='.repeat(50) + '\n');
  
  // Start memory monitoring
  startMemoryMonitoring();
});

// Handle server errors
server.on('error', (error) => {
  console.error('💥 Server error:', error);
  process.exit(1);
});

module.exports = app;