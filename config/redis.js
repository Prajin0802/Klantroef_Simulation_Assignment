const redis = require('redis');

// Redis client configuration
let redisClient = null;

// Initialize Redis client
async function initializeRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Handle Redis events
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis client ready');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    console.log('⚠️  Running without Redis caching');
    return null;
  }
}

// Cache helper functions
async function getCachedData(key) {
  if (!redisClient) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function setCachedData(key, data, ttl = 300) { // 5 minutes default TTL
  if (!redisClient) return false;
  
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

async function deleteCachedData(key) {
  if (!redisClient) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

// Generate cache key for analytics
function generateAnalyticsCacheKey(mediaId) {
  return `analytics:media:${mediaId}`;
}

// Invalidate analytics cache when new view is logged
async function invalidateAnalyticsCache(mediaId) {
  const cacheKey = generateAnalyticsCacheKey(mediaId);
  await deleteCachedData(cacheKey);
}

module.exports = {
  initializeRedis,
  getCachedData,
  setCachedData,
  deleteCachedData,
  generateAnalyticsCacheKey,
  invalidateAnalyticsCache,
  redisClient
}; 