/**
 * Performance Optimization Integration Guide
 *
 * This file demonstrates how to integrate the new performance optimization services
 * into your existing Wick Wax & Relax application.
 */

// =============================================================================
// 1. SERVER.JS INTEGRATION
// =============================================================================

/*
// Add these imports to backend/server.js
const cacheService = require('./services/cacheService');
const databaseOptimizationService = require('./services/databaseOptimizationService');
const enhancedCacheService = require('./services/enhancedCacheService');
const imageOptimizationService = require('./services/imageOptimizationService');

// Initialize services in startServer function
const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDb();
    console.log('Database initialized successfully');

    // Initialize performance services
    console.log('Initializing performance optimization services...');

    // Cache service is auto-initialized
    console.log('Cache service initialized');

    // Database optimization service is auto-initialized
    console.log('Database optimization service initialized');

    // Enhanced cache service is auto-initialized
    console.log('Enhanced cache service initialized');

    // Image optimization service is auto-initialized
    console.log('Image optimization service initialized');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Performance optimizations active!');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
*/

// =============================================================================
// 2. ROUTES INTEGRATION EXAMPLES
// =============================================================================

// Example: Integrating cache middleware into products route
/*
const { cacheMiddleware, cacheKeys } = require('../middleware/cache');

// In backend/routes/products.js, add cache to routes:

// GET /api/products - with caching
router.get('/', cacheMiddleware(1800, cacheKeys.products), async (req, res) => {
  // Your existing code...
});

// GET /api/products/:id - with caching
router.get('/:id', cacheMiddleware(3600, cacheKeys.productDetail), async (req, res) => {
  // Your existing code...
});
*/

// Example: Using database optimization service
/*
const databaseOptimizationService = require('../services/databaseOptimizationService');

// Replace direct queries with optimized versions
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;

    // Use optimized query with caching
    const result = await databaseOptimizationService.getProductsWithVariants({
      categoryId: category,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});
*/

// =============================================================================
// 3. CACHE INVALIDATION EXAMPLES
// =============================================================================

/*
// In product creation/update routes
const { invalidateCache } = require('../middleware/cache');

router.post('/', async (req, res) => {
  try {
    // Create product logic...

    // Invalidate related caches
    await invalidateCache.product(productId);

    res.status(201).json(product);
  } catch (error) {
    // Error handling...
  }
});
*/

// =============================================================================
// 4. FRONTEND INTEGRATION
// =============================================================================

/*
// In frontend/pages/_app.js
import { initializeOptimizations } from '../utils/bundleOptimization';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize all performance optimizations
    initializeOptimizations();
  }, []);

  return <Component {...pageProps} />;
}
*/

/*
// Lazy loading example in any component
import LazyComponent from '../components/LazyComponent';

const MyComponent = () => {
  return (
    <div>
      <LazyComponent
        component={() => import('./HeavyComponent')}
        fallback={<div>Loading...</div>}
      />
    </div>
  );
};
*/

// =============================================================================
// 5. MONITORING INTEGRATION
// =============================================================================

/*
// Add performance monitoring to any route
const { monitoringService } = require('../services/monitoring');

router.get('/stats', async (req, res) => {
  try {
    const startTime = Date.now();

    // Your logic here...

    const duration = Date.now() - startTime;

    // Record custom metrics
    monitoringService.recordBusinessMetric('stats_page_load', duration, {
      endpoint: '/stats',
      userId: req.user?.id
    });

    res.json(stats);
  } catch (error) {
    // Error monitoring is automatic via middleware
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
*/

// =============================================================================
// 6. IMAGE OPTIMIZATION INTEGRATION
// =============================================================================

/*
// In upload routes - already integrated in upload.js
// The image optimization service is automatically used
// when uploading product images
*/

// =============================================================================
// 7. ENVIRONMENT VARIABLES SETUP
// =============================================================================

/*
// Required environment variables in backend/.env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

CDN_URL=https://cdn.yourdomain.com
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

// Frontend environment variables
CDN_URL=https://cdn.yourdomain.com
*/

// =============================================================================
// 8. HEALTH CHECK ENDPOINTS
// =============================================================================

/*
// Add these endpoints to monitor optimization services

// GET /api/health/performance
router.get('/health/performance', async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      services: {
        cache: cacheService.isConnected,
        database: await databaseOptimizationService.healthCheck(),
        imageOptimization: { status: 'healthy' }, // Always healthy
        enhancedCache: { status: 'healthy' } // Always healthy
      }
    };

    const isHealthy = Object.values(health.services).every(service =>
      service.status === 'healthy' || service === true
    );

    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/cache/stats
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    const enhancedStats = await enhancedCacheService.getCacheAnalytics();

    res.json({
      basic: stats,
      enhanced: enhancedStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
});
*/

// =============================================================================
// 9. DEPLOYMENT CHECKLIST
// =============================================================================

/*
✅ Pre-deployment Checklist:

1. Environment Variables
   - [ ] REDIS_HOST, REDIS_PORT configured
   - [ ] CDN_URL set (optional)
   - [ ] JWT secrets configured
   - [ ] Database URL configured

2. Services
   - [ ] Redis server running
   - [ ] Database migrations applied
   - [ ] Performance indexes created

3. Frontend
   - [ ] next.config.cdn.js configured
   - [ ] Bundle optimization initialized
   - [ ] Lazy loading components implemented

4. Monitoring
   - [ ] Health check endpoints responding
   - [ ] Cache stats accessible
   - [ ] Performance metrics logging

5. Testing
   - [ ] Cache functionality verified
   - [ ] Image optimization tested
   - [ ] CDN assets loading correctly
   - [ ] Lazy loading working
   - [ ] Performance metrics accurate
*/

// =============================================================================
// 10. PERFORMANCE BENCHMARKING
// =============================================================================

/*
// Performance testing script
const runPerformanceTests = async () => {
  console.log('Running performance benchmarks...\n');

  // Test cache performance
  const cacheStart = Date.now();
  await cacheService.set('test', { data: 'test' });
  const cacheResult = await cacheService.get('test');
  const cacheTime = Date.now() - cacheStart;
  console.log(`Cache operation: ${cacheTime}ms`);

  // Test database optimization
  const dbStart = Date.now();
  const products = await databaseOptimizationService.getProductsWithVariants({ limit: 10 });
  const dbTime = Date.now() - dbStart;
  console.log(`Database query: ${dbTime}ms (${products.length} products)`);

  // Test image optimization
  const imageStart = Date.now();
  const imageResult = await imageOptimizationService.optimizeImage(
    './test-image.jpg',
    './optimized/',
    'test',
    { maxWidth: 800, maxHeight: 800 }
  );
  const imageTime = Date.now() - imageStart;
  console.log(`Image optimization: ${imageTime}ms (${imageResult.compressionRatio} reduction)`);

  console.log('\n✅ Performance tests completed!');
};

runPerformanceTests();
*/

module.exports = {
  // Export integration helpers if needed
  integrationNotes: 'See comments above for integration examples'
};