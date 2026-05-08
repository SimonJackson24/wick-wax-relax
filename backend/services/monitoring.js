const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const { logger, performanceMonitor } = require('./logger');

// Sentry is commented out during testing — uncomment in production
// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
//   integrations: [
//     new Sentry.Integrations.Http({ tracing: true }),
//     new Sentry.Integrations.Console(),
//     nodeProfilingIntegration(),
//   ],
//   tracesSampleRate: 0.1,   // Sample 10% of transactions for performance monitoring
//   profilesSampleRate: 0.1,
//   environment: process.env.NODE_ENV || 'development',
//   beforeSend: (event) => {
//     // Filter out development errors
//     if (process.env.NODE_ENV === 'development') {
//       return null;
//     }
//     return event;
//   }
// });

// Mock Sentry for testing
const Sentry = {
  withScope: (fn) => fn({ setTag: () => {}, setExtra: () => {}, setUser: () => {}, captureMessage: () => {}, captureException: () => {} }),
  captureMessage: () => {},
  captureException: () => {}
};

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      activeConnections: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    this.startTime = Date.now();
    this.memoryInterval = null;

    this.initMemoryMonitoring();
  }

  initMemoryMonitoring() {
    this.memoryInterval = setInterval(() => {
      performanceMonitor.logMemoryUsage();
      this.checkMemoryThreshold();
    }, 5 * 60 * 1000);
  }

  checkMemoryThreshold() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    if (usagePercent > 85) {
      logger.warn('High memory usage detected', {
        heapUsed: `${heapUsedMB.toFixed(2)}MB`,
        heapTotal: `${heapTotalMB.toFixed(2)}MB`,
        usagePercent: `${usagePercent.toFixed(2)}%`
      });

      if (global.gc) {
        global.gc();
        logger.info('Manual garbage collection triggered');
      }
    }
  }

  recordRequest(method, url, statusCode, duration) {
    this.metrics.requests++;
    this.metrics.responseTime.push(duration);
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift(); // Keep only last 1000 measurements
    }
    if (statusCode >= 400) {
      this.metrics.errors++;
    }
    if (duration > 2000) {
      Sentry.withScope((scope) => {
        scope.setTag('type', 'slow_request');
        scope.setTag('method', method);
        scope.setTag('url', url);
        scope.setExtra('duration', duration);
        Sentry.captureMessage(`Slow request: ${method} ${url} (${duration}ms)`, 'warning');
      });
    }
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  recordDatabaseQuery(query, duration, success = true) {
    performanceMonitor.logDatabaseQuery(query, duration, success);
    if (!success) {
      Sentry.withScope((scope) => {
        scope.setTag('type', 'database_error');
        scope.setExtra('query', query);
        scope.setExtra('duration', duration);
        Sentry.captureMessage('Database query failed', 'error');
      });
    }
  }

  recordApiCall(service, endpoint, method, duration, statusCode, success = true) {
    performanceMonitor.logApiCall(service, endpoint, method, duration, statusCode, success);
    if (!success) {
      Sentry.withScope((scope) => {
        scope.setTag('type', 'api_error');
        scope.setTag('service', service);
        scope.setExtra('endpoint', endpoint);
        scope.setExtra('method', method);
        scope.setExtra('duration', duration);
        scope.setExtra('statusCode', statusCode);
        Sentry.captureMessage(`API call failed: ${service} ${endpoint}`, 'error');
      });
    }
  }

  recordBusinessMetric(name, value, tags = {}) {
    logger.info('Business metric recorded', {
      metric: name,
      value,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;
    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
      : 0;
    return {
      uptime: `${Math.floor(uptime / 1000)}s`,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      cacheHitRate: `${cacheHitRate.toFixed(2)}%`,
      activeConnections: this.metrics.activeConnections,
      memory: process.memoryUsage()
    };
  }

  async healthCheck() {
    const metrics = this.getMetrics();
    const isHealthy = metrics.errorRate < 5;
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      metrics,
      services: {
        database: await this.checkDatabaseHealth(),
        cache: await this.checkCacheHealth(),
        externalAPIs: await this.checkExternalAPIHealth()
      }
    };
  }

  async checkDatabaseHealth() {
    try {
      // Implement database health check
      return { status: 'healthy', responseTime: '10ms' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkCacheHealth() {
    try {
      // Implement cache health check
      return { status: 'healthy', responseTime: '5ms' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkExternalAPIHealth() {
    const services = ['amazon', 'etsy'];
    const results = {};
    for (const service of services) {
      try {
        // Implement external API health checks
        results[service] = { status: 'healthy', responseTime: '100ms' };
      } catch (error) {
        results[service] = { status: 'unhealthy', error: error.message };
      }
    }
    return results;
  }

  alertCritical(message, data = {}) {
    logger.error('Critical alert', { message, ...data });
    Sentry.withScope((scope) => {
      scope.setLevel('fatal');
      scope.setTag('type', 'critical_alert');
      Object.keys(data).forEach(key => {
        scope.setExtra(key, data[key]);
      });
      Sentry.captureMessage(message, 'fatal');
    });
  }

  startProfiling(label) {
    return performanceMonitor.startTimer(label);
  }

  cleanup() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
  }
}

const requestMonitoring = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    monitoringService.recordRequest(req.method, req.url, res.statusCode, duration);
  });
  next();
};

const errorMonitoring = (error, req, res, next) => {
  monitoringService.metrics.errors++;
  console.log('Error monitoring - Processing error:', error.message);
  Sentry.withScope((scope) => {
    console.log('Error monitoring - Scope object:', typeof scope, 'setUser type:', typeof scope.setUser);
    scope.setTag('method', req.method);
    scope.setTag('url', req.url);
    try {
      scope.setUser({
        id: req.user?.id || 'anonymous',
        ip_address: req.ip
      });
      console.log('Error monitoring - setUser called successfully');
    } catch (setUserError) {
      console.error('Error monitoring - setUser error:', setUserError.message);
    }
    scope.setExtra('body', req.body);
    scope.setExtra('query', req.query);
    scope.setExtra('params', req.params);
    Sentry.captureException(error);
  });
  next(error);
};

const monitoringService = new MonitoringService();

module.exports = {
  monitoringService,
  requestMonitoring,
  errorMonitoring
};