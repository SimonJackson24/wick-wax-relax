/**
 * Performance Integration Test Script
 *
 * This script tests all the performance optimization services
 * to ensure they are properly integrated and working.
 */

const cacheService = require('./services/cacheService');
const databaseOptimizationService = require('./services/databaseOptimizationService');
const enhancedCacheService = require('./services/enhancedCacheService');
const imageOptimizationService = require('./services/imageOptimizationService');

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Integration Tests...\n');

  const results = {
    cacheService: false,
    databaseService: false,
    enhancedCacheService: false,
    imageService: false,
    overall: false
  };

  try {
    // Test 1: Cache Service
    console.log('📊 Testing Cache Service...');
    const cacheTest = await testCacheService();
    results.cacheService = cacheTest;
    console.log(`✅ Cache Service: ${cacheTest ? 'PASS' : 'FAIL'}\n`);

    // Test 2: Database Optimization Service
    console.log('🗄️ Testing Database Optimization Service...');
    const dbTest = await testDatabaseService();
    results.databaseService = dbTest;
    console.log(`✅ Database Service: ${dbTest ? 'PASS' : 'FAIL'}\n`);

    // Test 3: Enhanced Cache Service
    console.log('🔄 Testing Enhanced Cache Service...');
    const enhancedTest = await testEnhancedCacheService();
    results.enhancedCacheService = enhancedTest;
    console.log(`✅ Enhanced Cache Service: ${enhancedTest ? 'PASS' : 'FAIL'}\n`);

    // Test 4: Image Optimization Service
    console.log('🖼️ Testing Image Optimization Service...');
    const imageTest = await testImageService();
    results.imageService = imageTest;
    console.log(`✅ Image Service: ${imageTest ? 'PASS' : 'FAIL'}\n`);

    // Overall result
    results.overall = Object.values(results).every(result => result === true);

    console.log('📈 PERFORMANCE TEST RESULTS:');
    console.log('='.repeat(50));
    console.log(`Cache Service: ${results.cacheService ? '✅' : '❌'}`);
    console.log(`Database Service: ${results.databaseService ? '✅' : '❌'}`);
    console.log(`Enhanced Cache Service: ${results.enhancedCacheService ? '✅' : '❌'}`);
    console.log(`Image Service: ${results.imageService ? '✅' : '❌'}`);
    console.log('='.repeat(50));
    console.log(`OVERALL RESULT: ${results.overall ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);

    if (results.overall) {
      console.log('\n🎯 Performance optimizations are successfully integrated!');
      console.log('📋 Next steps:');
      console.log('   1. Start Redis server: redis-server');
      console.log('   2. Use server.performance.js instead of server.js');
      console.log('   3. Use _app.performance.js instead of _app.js');
      console.log('   4. Use routes/products.performance.js for cached routes');
      console.log('   5. Test with: npm run build && npm start (frontend)');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    results.overall = false;
  }

  return results;
}

async function testCacheService() {
  try {
    // Test basic cache operations
    const testKey = 'test:integration';
    const testData = { message: 'Performance integration test', timestamp: Date.now() };

    // Test set
    const setResult = await cacheService.set(testKey, testData, 60);
    if (!setResult) return false;

    // Test get
    const getResult = await cacheService.get(testKey);
    if (!getResult || getResult.message !== testData.message) return false;

    // Test delete
    const delResult = await cacheService.del(testKey);
    if (!delResult) return false;

    // Test stats
    const stats = await cacheService.getStats();
    if (!stats) return false;

    return true;
  } catch (error) {
    console.error('Cache service test failed:', error.message);
    return false;
  }
}

async function testDatabaseService() {
  try {
    // Test health check
    const health = await databaseOptimizationService.healthCheck();
    if (health.status !== 'healthy') return false;

    // Test query stats
    const stats = databaseOptimizationService.getQueryStats();
    if (!stats) return false;

    return true;
  } catch (error) {
    console.error('Database service test failed:', error.message);
    return false;
  }
}

async function testEnhancedCacheService() {
  try {
    // Test cache analytics
    const analytics = await enhancedCacheService.getCacheAnalytics();
    if (!analytics) return false;

    return true;
  } catch (error) {
    console.error('Enhanced cache service test failed:', error.message);
    return false;
  }
}

async function testImageService() {
  try {
    // Test service availability (don't create actual files)
    if (!imageOptimizationService) return false;

    // Test configuration
    const config = imageOptimizationService.getConfig();
    if (!config) return false;

    return true;
  } catch (error) {
    console.error('Image service test failed:', error.message);
    return false;
  }
}

// Performance benchmark
async function runBenchmark() {
  console.log('\n⏱️ Running Performance Benchmark...\n');

  const benchmarks = {
    cacheOperations: await benchmarkCacheOperations(),
    databaseQueries: await benchmarkDatabaseQueries()
  };

  console.log('📊 BENCHMARK RESULTS:');
  console.log(`Cache Operations: ${benchmarks.cacheOperations.avgTime}ms avg`);
  console.log(`Database Queries: ${benchmarks.databaseQueries.avgTime}ms avg`);

  return benchmarks;
}

async function benchmarkCacheOperations(iterations = 100) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await cacheService.set(`bench:${i}`, { data: i });
    await cacheService.get(`bench:${i}`);
    await cacheService.del(`bench:${i}`);
    times.push(Date.now() - start);
  }

  return {
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times)
  };
}

async function benchmarkDatabaseQueries(iterations = 10) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await databaseOptimizationService.healthCheck();
    times.push(Date.now() - start);
  }

  return {
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times)
  };
}

// Main execution
if (require.main === module) {
  runPerformanceTests()
    .then(async (results) => {
      if (results.overall) {
        await runBenchmark();
      }
      process.exit(results.overall ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests, runBenchmark };