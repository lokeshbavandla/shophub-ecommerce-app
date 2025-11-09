import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

// Redis configuration optimized for production environments
// Handles connection failures gracefully with automatic retry and reconnection
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn({ times, delay }, "Redis: Retrying connection");
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: false,
  connectTimeout: 10000,
  lazyConnect: true,
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      logger.error("Redis: Redis is in readonly mode, reconnecting...");
      return true;
    }
    return false;
  },
};

export const redis = new Redis(redisConfig);
redis.on("connect", () => {
  logger.info("Redis: Connected to Redis server");
});

redis.on("ready", () => {
  logger.info("Redis: Redis client is ready");
});

redis.on("error", (err) => {
  logger.error({ error: err.message }, "Redis: Connection error");
});

redis.on("close", () => {
  logger.warn("Redis: Connection closed");
});

redis.on("reconnecting", (time) => {
  logger.info({ time }, "Redis: Reconnecting to Redis server");
});

redis.on("end", () => {
  logger.warn("Redis: Connection ended");
});

// Initialize Redis connection with graceful error handling
// Application continues to function even if Redis is unavailable (graceful degradation)
export const connectRedis = async () => {
  try {
    await redis.connect();
    logger.info("Redis: Successfully connected to Redis");
  } catch (error) {
    logger.error({ error: error.message }, "Redis: Failed to connect to Redis");
  }
};

// Health check endpoint for monitoring and load balancer health checks
export const checkRedisHealth = async () => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error({ error: error.message }, "Redis: Health check failed");
    return false;
  }
};

// Graceful shutdown handler for production deployments
// Ensures clean disconnection during container restarts and deployments
export const disconnectRedis = async () => {
  try {
    await redis.quit();
    logger.info("Redis: Disconnected from Redis");
  } catch (error) {
    logger.error({ error: error.message }, "Redis: Error during disconnect");
  }
};

// Cache operations with error handling for production resilience
// Returns null/false on failure instead of throwing to prevent application crashes
export const cacheGet = async (key) => {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(
      { error: error.message, key },
      "Redis: Error getting from cache"
    );
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = null) => {
  try {
    const stringValue = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, stringValue);
    } else {
      await redis.set(key, stringValue);
    }
    return true;
  } catch (error) {
    logger.error({ error: error.message, key }, "Redis: Error setting cache");
    return false;
  }
};

export const cacheDel = async (key) => {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error(
      { error: error.message, key },
      "Redis: Error deleting from cache"
    );
    return false;
  }
};

export const cacheDelPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    logger.error(
      { error: error.message, pattern },
      "Redis: Error deleting pattern from cache"
    );
    return false;
  }
};

// Centralized cache key generation for consistency and easier cache management
export const CacheKeys = {
  // Product keys
  featuredProducts: () => "products:featured",
  allProducts: () => "products:all",
  productById: (id) => `products:${id}`,
  productsByCategory: (category) => `products:category:${category}`,
  recommendedProducts: () => "products:recommended",

  // User keys
  userProfile: (userId) => `user:${userId}:profile`,
  userCart: (userId) => `user:${userId}:cart`,

  // Coupon keys
  userCoupon: (userId) => `coupon:user:${userId}`,
  couponByCode: (code) => `coupon:code:${code}`,

  // Analytics keys
  analyticsData: () => "analytics:data",
  dailySalesData: (startDate, endDate) =>
    `analytics:daily:${startDate}:${endDate}`,
};
