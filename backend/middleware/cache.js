// In-memory cache fallback (no Redis required)
const createMemoryCache = () => {
  const cache = new Map();
  const timers = new Map();
  
  return {
    get: async (key) => {
      const item = cache.get(key);
      if (item && item.expiry > Date.now()) {
        console.log('🟡 Memory cache hit:', key);
        return item.value;
      }
      // Remove expired item
      if (item) {
        cache.delete(key);
        const timer = timers.get(key);
        if (timer) clearTimeout(timer);
        timers.delete(key);
      }
      return null;
    },
    
    set: async (key, value, options = {}) => {
      const duration = options.EX || 300; // Default 5 minutes
      const expiry = Date.now() + (duration * 1000);
      
      cache.set(key, { value, expiry });
      
      // Set cleanup timer
      const timer = setTimeout(() => {
        cache.delete(key);
        timers.delete(key);
      }, duration * 1000);
      
      timers.set(key, timer);
      console.log('🟡 Memory cache set:', key, `(expires in ${duration}s)`);
      return 'OK';
    },
    
    del: async (keys) => {
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          cache.delete(key);
          const timer = timers.get(key);
          if (timer) clearTimeout(timer);
          timers.delete(key);
        });
      } else {
        cache.delete(keys);
        const timer = timers.get(keys);
        if (timer) clearTimeout(timer);
        timers.delete(keys);
      }
      console.log('🟡 Memory cache deleted:', keys);
      return 1;
    },
    
    isOpen: true,
    
    // Additional helper methods
    keys: async (pattern) => {
      const allKeys = Array.from(cache.keys());
      if (pattern === '*') return allKeys;
      
      // Simple pattern matching (supports * at end)
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return allKeys.filter(key => regex.test(key));
    },
    
    // Clear all cache (for testing/reset)
    flushAll: async () => {
      cache.clear();
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
      console.log('🟡 Memory cache cleared');
    },
    
    // Get cache stats
    getStats: () => {
      return {
        size: cache.size,
        keys: Array.from(cache.keys())
      };
    }
  };
};

// Create memory cache instance
const memoryCache = createMemoryCache();

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Don't cache auth routes or sensitive endpoints
    if (req.path.includes('/auth/') || 
        req.path.includes('/orders/') ||
        req.path.includes('/users/') ||
        req.path.includes('/crm/')) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await memoryCache.get(key);
      
      if (cachedData) {
        console.log('✅ Serving from memory cache:', key);
        const data = JSON.parse(cachedData);
        return res.json({
          success: true,
          data: data,
          cached: true,
          source: 'memory'
        });
      }

      // Override res.json to cache response
      const originalJson = res.json;
      res.json = function(data) {
        if (data.success) {
          // Only cache successful responses
          memoryCache.set(key, JSON.stringify(data.data || data), { EX: duration })
            .catch(err => console.log('Cache set error:', err));
        }
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.log('⚠️ Cache middleware error, proceeding without cache:', error.message);
      next();
    }
  };
};

// Clear cache for specific patterns
const clearCache = async (pattern) => {
  try {
    const keys = await memoryCache.keys(pattern);
    if (keys.length > 0) {
      await memoryCache.del(keys);
      console.log(`✅ Cleared memory cache for pattern: ${pattern}`);
    }
  } catch (error) {
    console.log('⚠️ Error clearing cache:', error.message);
  }
};

// Clear entire cache
const clearAllCache = async () => {
  try {
    await memoryCache.flushAll();
    console.log('✅ Cleared all memory cache');
  } catch (error) {
    console.log('⚠️ Error clearing all cache:', error.message);
  }
};

// Get cache statistics
const getCacheStats = () => {
  return memoryCache.getStats();
};

module.exports = { 
  cacheMiddleware, 
  clearCache, 
  clearAllCache,
  getCacheStats,
  memoryCache // Export for direct access if needed
};