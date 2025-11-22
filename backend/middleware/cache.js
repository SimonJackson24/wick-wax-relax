const cacheService = require('../services/cacheService');

const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `api:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function(data) {
        // Cache the response
        cacheService.set(cacheKey, data, ttl).catch(error => {
          console.error('Error caching response:', error);
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      console.log(`Cache miss for key: ${cacheKey}`);
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache key generators for different types of requests
const cacheKeys = {
  // Product-related cache keys
  products: (req) => {
    const { category, page, limit, search } = req.query;
    return `products:${category || 'all'}:${page || 1}:${limit || 20}:${search || ''}`;
  },

  // Product detail cache key
  productDetail: (req) => `product:${req.params.id}`,

  // Category cache key
  categories: (req) => 'categories:all',

  // User profile cache key
  userProfile: (req) => `user:${req.user?.id || 'anonymous'}:profile`,

  // Orders cache key
  orders: (req) => {
    const { status, page, limit } = req.query;
    return `orders:${req.user?.id || 'anonymous'}:${status || 'all'}:${page || 1}:${limit || 20}`;
  },

  // Inventory cache key
  inventory: (req) => {
    const { category, lowStock } = req.query;
    return `inventory:${category || 'all'}:${lowStock || 'false'}`;
  },

  // Search results cache key
  search: (req) => {
    const { q, category, page, limit } = req.query;
    return `search:${q || ''}:${category || 'all'}:${page || 1}:${limit || 20}`;
  }
};

// Cache invalidation helpers
const invalidateCache = {
  // Invalidate product-related caches
  product: async (productId) => {
    const keys = [
      `product:${productId}`,
      'products:all:*', // This would need to be handled with pattern matching
      'search:*' // Invalidate search results
    ];

    for (const key of keys) {
      if (key.includes('*')) {
        await cacheService.clearPattern(key);
      } else {
        await cacheService.del(key);
      }
    }
  },

  // Invalidate category cache
  category: async () => {
    await cacheService.del('categories:all');
  },

  // Invalidate user caches
  user: async (userId) => {
    const keys = [
      `user:${userId}:profile`,
      `orders:${userId}:*`
    ];

    for (const key of keys) {
      if (key.includes('*')) {
        await cacheService.clearPattern(key);
      } else {
        await cacheService.del(key);
      }
    }
  },

  // Invalidate inventory cache
  inventory: async () => {
    await cacheService.clearPattern('inventory:*');
  },

  // Invalidate all caches
  all: async () => {
    // This is a simple implementation - in production, you might want to use Redis FLUSHDB
    const patterns = [
      'products:*',
      'product:*',
      'categories:*',
      'user:*',
      'orders:*',
      'inventory:*',
      'search:*'
    ];

    for (const pattern of patterns) {
      await cacheService.clearPattern(pattern);
    }
  }
};

// Cache warming function
const warmCache = {
  // Warm product cache
  products: async () => {
    try {
      // This would typically call your product service
      console.log('Warming product cache...');
      // Implementation would depend on your product service
    } catch (error) {
      console.error('Error warming product cache:', error);
    }
  },

  // Warm category cache
  categories: async () => {
    try {
      console.log('Warming category cache...');
      // Implementation would depend on your category service
    } catch (error) {
      console.error('Error warming category cache:', error);
    }
  }
};

module.exports = {
  cacheMiddleware,
  cacheKeys,
  invalidateCache,
  warmCache
};