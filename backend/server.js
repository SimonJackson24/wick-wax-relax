const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const promMid = require('express-prometheus-middleware');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { initializeDb } = require('./config/database');
const { requestMonitoring, errorMonitoring } = require('./services/monitoring');
const { requestLogger, errorLogger } = require('./services/logger');

const app = express();
const PORT = process.env.PORT || 3001;

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

const getAllowedOrigins = () => {
  const origins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ];

  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3001');
    origins.push('http://localhost:3002');
    origins.push('http://localhost:3003');
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl && (frontendUrl.includes('yourdomain.com') || frontendUrl.includes('localhost') === false && !frontendUrl.startsWith('https://'))) {
    console.error('SECURITY ERROR: FRONTEND_URL appears to be misconfigured:', frontendUrl);
  }

  return origins;
};

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());

app.use(promMid({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 5, 10],
  requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  metricsMiddleware: {
    // Restrict /metrics to localhost only — do not expose publicly
    middleware: (req, res, next) => {
      const allowed = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
      if (!allowed.includes(req.ip) && req.ip !== 'localhost') {
        return res.status(403).json({ error: 'Metrics endpoint not available externally' });
      }
      next();
    }
  }
}));

app.use(requestLogger);
app.use(requestMonitoring);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const skippedPaths = [
      '/api/health',
      '/api/search/health',
      '/api/search/popular',
      '/api/search/filters',
    ];
    if (skippedPaths.includes(req.path)) return true;
    if (req.path.startsWith('/images/') || req.path.startsWith('/fonts/')) return true;
    return false;
  }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/fonts', express.static(path.join(__dirname, '../frontend/public/fonts')));

// Webhook routes (must be before JSON parsing for raw body access)
app.use('/api/webhooks', require('./routes/webhooks'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/promo', require('./routes/promo'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/settings', require('./routes/settings'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/push', require('./routes/push'));
app.use('/api/amazon', require('./routes/amazon'));
app.use('/api/etsy', require('./routes/etsy'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/export', require('./routes/export'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/seo', require('./routes/seo'));
app.use('/api/search', require('./routes/search'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorLogger);
app.use(errorMonitoring);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async () => {
  try {
    await initializeDb();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;