const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const promMid = require('express-prometheus-middleware');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import database configuration
const { initializeDb } = require('./config/database');

// Import monitoring services
const { requestMonitoring, errorMonitoring } = require('./services/monitoring');
const { requestLogger, errorLogger } = require('./services/logger');

// Import performance optimization services
const cacheService = require('./services/cacheService');
const databaseOptimizationService = require('./services/databaseOptimizationService');
const enhancedCacheService = require('./services/enhancedCacheService');
const imageOptimizationService = require('./services/imageOptimizationService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3002', // Add frontend port 3002
      'http://localhost:3003', // Add frontend port 3003
      'https://yourdomain.com', // Add your production domain
    ];
    // Allow requests with no origin (mobile apps, etc.)
    console.log('CORS check - Origin:', origin, 'Allowed:', allowedOrigins);
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());

// Monitoring middleware
app.use(promMid({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 5, 10],
  requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
}));

// Request logging and monitoring
app.use(requestLogger);
app.use(requestMonitoring);

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/api/health' || req.path.startsWith('/images/') || req.path.startsWith('/fonts/');
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Static file serving
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/fonts', express.static(path.join(__dirname, '../frontend/public/fonts')));

// Webhook routes (must be before JSON parsing for raw body access)

// Webhook routes (must be before JSON parsing for raw body access)
app.use('/api/webhooks', require('./routes/webhooks'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/push', require('./routes/push'));
app.use('/api/amazon', require('./routes/amazon'));
app.use('/api/etsy', require('./routes/etsy'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/export', require('./routes/export'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Performance health check endpoint
app.get('/api/health/performance', async (req, res) => {
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

// Cache stats endpoint
app.get('/api/cache/stats', async (req, res) => {
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

// Error monitoring middleware
app.use(errorLogger);
app.use(errorMonitoring);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
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

startServer();

module.exports = app;