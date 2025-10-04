// backend/middleware/cache.js
const redisClient = require('../config/redis');

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Don't cache auth routes
    if (req.path.includes('/auth/') || req.path.includes('/orders/')) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    try {
      if (!redisClient.isOpen) {
        return next();
      }

      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        console.log('Serving from cache:', key);
        const data = JSON.parse(cachedData);
        return res.json({
          success: true,
          data: data,
          cached: true
        });
      }

      // Override res.json to cache response
      const originalJson = res.json;
      res.json = function(data) {
        if (data.success && redisClient.isOpen) {
          redisClient.setEx(key, duration, JSON.stringify(data.data || data));
        }
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.log('Cache error, proceeding without cache');
      next();
    }
  };
};

// Clear cache for specific routes
const clearCache = async (pattern) => {
  try {
    if (redisClient.isOpen) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Cleared cache for pattern: ${pattern}`);
      }
    }
  } catch (error) {
    console.log('Error clearing cache:', error);
  }
};

module.exports = { cacheMiddleware, clearCache };