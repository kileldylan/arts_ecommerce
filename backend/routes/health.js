// backend/routes/health.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const redisClient = require('../config/redis');

router.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'Unknown',
    redis: 'Unknown',
    environment: process.env.NODE_ENV
  };

  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    healthcheck.database = dbError ? 'Error' : 'Connected';

    // Test Redis connection
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      healthcheck.redis = 'Connected';
    } else {
      healthcheck.redis = 'Not configured';
    }

    const statusCode = healthcheck.database === 'Connected' ? 200 : 503;
    res.status(statusCode).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'ERROR';
    healthcheck.error = error.message;
    res.status(503).json(healthcheck);
  }
});

// Metrics endpoint for monitoring
router.get('/metrics', (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    node_version: process.version,
    platform: process.platform
  };
  
  res.json(metrics);
});

module.exports = router;