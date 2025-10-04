// backend/routes/health.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../server'); // Use the supabase client from server.js

router.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'Unknown',
    cache: 'Memory Only',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };

  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    healthcheck.database = dbError ? 'Error' : 'Connected';
    healthcheck.cache = 'Memory Cache (Redis not configured)';

    const statusCode = healthcheck.database === 'Connected' ? 200 : 503;
    
    // Add memory usage in MB for readability
    healthcheck.memoryUsage = {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
    };
    
    res.status(statusCode).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'ERROR';
    healthcheck.error = error.message;
    healthcheck.database = 'Connection Failed';
    
    res.status(503).json(healthcheck);
  }
});

// Enhanced metrics endpoint for monitoring
router.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  
  const metrics = {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
    },
    cpu: process.cpuUsage(),
    uptime: Math.round(process.uptime()) + ' seconds',
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: metrics,
    message: 'System metrics retrieved successfully'
  });
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()) + ' seconds'
  });
});

// Database connection test
router.get('/db-test', async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    res.json({
      success: true,
      connected: !error,
      error: error ? error.message : null,
      tables: ['products'], // You can expand this to test more tables
      message: error ? 'Database connection failed' : 'Database connected successfully'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error.message,
      message: 'Database connection test failed'
    });
  }
});

module.exports = router;