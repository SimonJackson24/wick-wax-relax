const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Use REDIS_URL if provided (for Redis Cloud), otherwise use individual settings
      const redisConfig = process.env.REDIS_URL
        ? process.env.REDIS_URL
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: process.env.REDIS_DB || 0,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true
          };

      this.redis = new Redis(redisConfig);

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        // Only log error if Redis is expected to be available
        if (process.env.REDIS_HOST || process.env.REDIS_PORT) {
          console.error('Redis connection error:', error);
        } else {
          console.log('Redis not available, using fallback cache');
        }
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

      await this.redis.connect();
      console.log('Redis connection established');
    } catch (error) {
      // Only log error if Redis is expected to be available
      if (process.env.REDIS_HOST || process.env.REDIS_PORT) {
        console.error('Error establishing Redis connection:', error);
      } else {
        console.log('Redis not available, using fallback cache');
      }
      this.isConnected = false;
    }
  }

  // Set cache with expiration
  async set(key, value, ttl = 3600) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  // Get cache
  async get(key) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  // Delete cache
  async del(key) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache delete');
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Error deleting cache:', error);
      return false;
    }
  }

  // Set hash field
  async hset(key, field, value) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping hash set');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
      return true;
    } catch (error) {
      console.error('Error setting hash:', error);
      return false;
    }
  }

  // Get hash field
  async hget(key, field) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping hash get');
      return null;
    }

    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting hash:', error);
      return null;
    }
  }

  // Get all hash fields
  async hgetall(key) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping hash getall');
      return null;
    }

    try {
      const hash = await this.redis.hgetall(key);
      const parsedHash = {};

      for (const [field, value] of Object.entries(hash)) {
        try {
          parsedHash[field] = JSON.parse(value);
        } catch {
          parsedHash[field] = value;
        }
      }

      return parsedHash;
    } catch (error) {
      console.error('Error getting hash all:', error);
      return null;
    }
  }

  // Set multiple keys
  async mset(keyValuePairs) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping mset');
      return false;
    }

    try {
      const serializedPairs = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs[key] = JSON.stringify(value);
      }

      await this.redis.mset(serializedPairs);
      return true;
    } catch (error) {
      console.error('Error setting multiple keys:', error);
      return false;
    }
  }

  // Get multiple keys
  async mget(keys) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping mget');
      return null;
    }

    try {
      const values = await this.redis.mget(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Error getting multiple keys:', error);
      return null;
    }
  }

  // Check if key exists
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Error checking key existence:', error);
      return false;
    }
  }

  // Set expiration on key
  async expire(key, ttl) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping expire');
      return false;
    }

    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Error setting expiration:', error);
      return false;
    }
  }

  // Increment counter
  async incr(key) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping incr');
      return null;
    }

    try {
      const result = await this.redis.incr(key);
      return result;
    } catch (error) {
      console.error('Error incrementing counter:', error);
      return null;
    }
  }

  // Add to sorted set
  async zadd(key, score, member) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping zadd');
      return false;
    }

    try {
      await this.redis.zadd(key, score, member);
      return true;
    } catch (error) {
      console.error('Error adding to sorted set:', error);
      return false;
    }
  }

  // Get range from sorted set
  async zrange(key, start, stop, withScores = false) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping zrange');
      return null;
    }

    try {
      const result = await this.redis.zrange(key, start, stop, withScores ? 'WITHSCORES' : undefined);
      return result;
    } catch (error) {
      console.error('Error getting sorted set range:', error);
      return null;
    }
  }

  // Cache wrapper for functions
  async cachedFunction(key, fn, ttl = 3600) {
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    if (result !== null && result !== undefined) {
      await this.set(key, result, ttl);
    }

    return result;
  }

  // Clear cache pattern
  async clearPattern(pattern) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping clear pattern');
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Error clearing cache pattern:', error);
      return false;
    }
  }

  // Get cache statistics
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info();
      const dbSize = await this.redis.dbsize();

      return {
        connected: true,
        dbSize: dbSize,
        info: info
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { connected: false, error: error.message };
    }
  }

  // Close connection
  async close() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

module.exports = new CacheService();