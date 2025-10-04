const redis = require('redis');

let redisClient;

if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
} else {
  // Fallback for development
  redisClient = redis.createClient({
    socket: {
      host: 'localhost',
      port: 6379
    }
  });
}

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected'));

// Connect only if Redis is available
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.log('Redis connection failed, continuing without cache:', error.message);
  }
};

connectRedis();

module.exports = redisClient;