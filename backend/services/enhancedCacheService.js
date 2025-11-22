const cacheService = require('./cacheService');

class EnhancedCacheService {
  constructor() {
    this.cacheStrategies = {
      // Write-through: Update cache when data changes
      writeThrough: true,

      // Cache warming for frequently accessed data
      warmingEnabled: true,

      // Cache invalidation patterns
      invalidationPatterns: {
        products: ['products:*', 'product:*', 'categories:*'],
        orders: ['orders:*', 'order:*'],
        users: ['users:*', 'user:*'],
        inventory: ['inventory:*']
      }
    };

    // Initialize cache warming
    this.initializeCacheWarming();
  }

  // Multi-level caching strategy
  async getWithFallback(key, fetchFunction, options = {}) {
    const {
      ttl = 300,
      fallbackTTL = 3600,
      useFallback = true
    } = options;

    // Try primary cache
    let data = await cacheService.get(key);
    if (data) {
      return { data, source: 'primary' };
    }

    // Try fallback cache if enabled
    if (useFallback) {
      const fallbackKey = `fallback:${key}`;
      data = await cacheService.get(fallbackKey);
      if (data) {
        // Refresh primary cache in background
        this.refreshPrimaryCache(key, fetchFunction, ttl);
        return { data, source: 'fallback' };
      }
    }

    // Fetch from source
    try {
      data = await fetchFunction();

      if (data) {
        // Cache in primary
        await cacheService.set(key, data, ttl);

        // Cache in fallback for longer term
        if (useFallback) {
          await cacheService.set(`fallback:${key}`, data, fallbackTTL);
        }
      }

      return { data, source: 'source' };
    } catch (error) {
      console.error('Error fetching data for cache:', error);
      throw error;
    }
  }

  // Background cache refresh
  async refreshPrimaryCache(key, fetchFunction, ttl) {
    try {
      const data = await fetchFunction();
      if (data) {
        await cacheService.set(key, data, ttl);
        console.log(`Refreshed primary cache for key: ${key}`);
      }
    } catch (error) {
      console.error(`Failed to refresh primary cache for key: ${key}`, error);
    }
  }

  // Cache warming for critical data
  async warmCriticalCache() {
    console.log('Starting cache warming...');

    const warmingTasks = [
      // Warm product categories
      this.warmProductCategories(),

      // Warm featured products
      this.warmFeaturedProducts(),

      // Warm popular products
      this.warmPopularProducts(),

      // Warm user session data patterns
      this.warmUserPatterns()
    ];

    try {
      await Promise.allSettled(warmingTasks);
      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  async warmProductCategories() {
    try {
      // This would typically call your database service
      const categories = [
        { id: 1, name: 'Wax Melts', slug: 'wax-melts' },
        { id: 2, name: 'Candles', slug: 'candles' },
        { id: 3, name: 'Bath Bombs', slug: 'bath-bombs' }
      ];

      await cacheService.set('categories:all', categories, 3600);
      console.log('Warmed categories cache');
    } catch (error) {
      console.error('Failed to warm categories cache:', error);
    }
  }

  async warmFeaturedProducts() {
    try {
      // Warm featured products cache
      const featuredProducts = []; // Would fetch from database
      await cacheService.set('products:featured', featuredProducts, 1800);
      console.log('Warmed featured products cache');
    } catch (error) {
      console.error('Failed to warm featured products cache:', error);
    }
  }

  async warmPopularProducts() {
    try {
      // Warm popular products cache
      const popularProducts = []; // Would fetch from database
      await cacheService.set('products:popular', popularProducts, 1800);
      console.log('Warmed popular products cache');
    } catch (error) {
      console.error('Failed to warm popular products cache:', error);
    }
  }

  async warmUserPatterns() {
    try {
      // Warm common user data patterns
      const userPatterns = ['profile', 'orders', 'addresses'];
      for (const pattern of userPatterns) {
        await cacheService.set(`user:patterns:${pattern}`, {}, 3600);
      }
      console.log('Warmed user patterns cache');
    } catch (error) {
      console.error('Failed to warm user patterns cache:', error);
    }
  }

  // Intelligent cache invalidation
  async invalidateRelatedCache(entityType, entityId, relatedData = {}) {
    const patterns = this.cacheStrategies.invalidationPatterns[entityType] || [];

    // Invalidate specific entity cache
    await cacheService.del(`${entityType}:${entityId}`);

    // Invalidate related patterns
    for (const pattern of patterns) {
      await cacheService.clearPattern(pattern);
    }

    // Invalidate computed/derived caches
    if (entityType === 'products') {
      await this.invalidateProductRelatedCache(entityId, relatedData);
    } else if (entityType === 'orders') {
      await this.invalidateOrderRelatedCache(entityId, relatedData);
    }

    console.log(`Invalidated cache for ${entityType}:${entityId}`);
  }

  async invalidateProductRelatedCache(productId, productData) {
    // Invalidate category-specific caches
    if (productData.categoryIds) {
      for (const categoryId of productData.categoryIds) {
        await cacheService.clearPattern(`products:category:${categoryId}:*`);
      }
    }

    // Invalidate search caches
    await cacheService.clearPattern('search:*');

    // Invalidate featured/popular caches if applicable
    if (productData.isFeatured) {
      await cacheService.del('products:featured');
    }
  }

  async invalidateOrderRelatedCache(orderId, orderData) {
    // Invalidate user-specific order caches
    if (orderData.userId) {
      await cacheService.clearPattern(`orders:user:${orderData.userId}:*`);
    }

    // Invalidate inventory caches if order affects stock
    if (orderData.items) {
      for (const item of orderData.items) {
        await cacheService.del(`inventory:product:${item.productId}`);
      }
    }
  }

  // Cache analytics and monitoring
  async getCacheAnalytics() {
    const stats = await cacheService.getStats();

    // Get hit/miss ratios for different cache types
    const cacheTypes = ['products', 'orders', 'users', 'inventory', 'api'];
    const analytics = {};

    for (const type of cacheTypes) {
      const typeStats = await this.getCacheTypeStats(type);
      analytics[type] = typeStats;
    }

    return {
      overall: stats,
      byType: analytics,
      recommendations: this.generateCacheRecommendations(analytics)
    };
  }

  async getCacheTypeStats(type) {
    // This would track hits/misses per cache type
    // Implementation would depend on your monitoring setup
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgResponseTime: 0
    };
  }

  generateCacheRecommendations(analytics) {
    const recommendations = [];

    // Analyze cache performance and suggest improvements
    Object.entries(analytics.byType).forEach(([type, stats]) => {
      if (stats.hitRate < 0.7) {
        recommendations.push({
          type: 'low_hit_rate',
          cacheType: type,
          message: `Consider increasing TTL or improving cache keys for ${type} cache`,
          currentHitRate: stats.hitRate
        });
      }

      if (stats.avgResponseTime > 100) {
        recommendations.push({
          type: 'slow_cache',
          cacheType: type,
          message: `Cache response time is high for ${type}, consider optimization`,
          avgResponseTime: stats.avgResponseTime
        });
      }
    });

    return recommendations;
  }

  // Cache preloading for predicted requests
  async preloadPredictedCache(userId, userBehavior = {}) {
    const predictions = this.predictUserRequests(userId, userBehavior);

    for (const prediction of predictions) {
      // Preload predicted data in background
      setTimeout(async () => {
        try {
          // This would call your data fetching functions
          console.log(`Preloading predicted cache: ${prediction.key}`);
        } catch (error) {
          console.error('Failed to preload predicted cache:', error);
        }
      }, prediction.delay);
    }
  }

  predictUserRequests(userId, behavior) {
    // Simple prediction logic based on user behavior
    const predictions = [];

    if (behavior.lastViewedCategory) {
      predictions.push({
        key: `products:category:${behavior.lastViewedCategory}`,
        delay: 1000
      });
    }

    if (behavior.frequentlyOrderedProducts) {
      predictions.push({
        key: `products:related:${behavior.frequentlyOrderedProducts.join(',')}`,
        delay: 2000
      });
    }

    return predictions;
  }

  // Initialize cache warming on startup
  async initializeCacheWarming() {
    if (this.cacheStrategies.warmingEnabled) {
      // Warm cache after a short delay to allow system to start
      setTimeout(() => {
        this.warmCriticalCache();
      }, 5000);

      // Set up periodic cache warming
      setInterval(() => {
        this.warmCriticalCache();
      }, 3600000); // Every hour
    }
  }
}

module.exports = new EnhancedCacheService();