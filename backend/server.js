const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const promMid = require('express-prometheus-middleware');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { initializeDb, shutdown: shutdownDb } = require('./config/database');
const { close: closeRedis } = require('./config/redis');
const { requestMonitoring, errorMonitoring } = require('./services/monitoring');
const { requestLogger, errorLogger } = require('./services/logger');
const { csrfProtection } = require('./middleware/csrf');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Fail fast on missing critical configuration. We never want to start a
// production process without JWT secrets.
function assertProductionConfig() {
  if (!isProduction) return;
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error('FATAL: required production env vars missing:', missing.join(', '));
    process.exit(1);
  }
  if (process.env.FRONTEND_URL && (process.env.FRONTEND_URL.includes('localhost') || process.env.FRONTEND_URL.includes('127.0.0.1'))) {
    console.error('FATAL: FRONTEND_URL is set to a localhost address in production');
    process.exit(1);
  }
  if (!process.env.REVOLUT_WEBHOOK_SECRET) {
    console.error('FATAL: REVOLUT_WEBHOOK_SECRET must be set in production');
    process.exit(1);
  }
}
assertProductionConfig();

// Trust the first proxy in front of us (Cloudflare, nginx). Required for
// correct req.ip and rate-limit keying. Without this, every request appears
// to come from the proxy IP and rate limits are global.
app.set('trust proxy', 1);

// Tightened CSP. The previous config allowed any https: image but had no
// connect-src, frame-ancestors, or object-src, which means analytics/3rd-party
// API calls would be blocked and the site could be embedded in iframes.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: [
          "'self'",
          'https://api.revolut.com',
          'https://www.google-analytics.com',
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);

const getAllowedOrigins = () => {
  const origins = [];
  if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);

  // Localhost is only allowed in non-production environments.
  if (!isProduction) {
    origins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002');
  }
  return origins;
};

app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = getAllowedOrigins();
      // Same-origin / curl / server-to-server (no Origin header) is permitted
      // only in non-production. In production, every request must come from
      // a known browser origin so CSRF + cookie + CORS stay consistent.
      if (!origin) {
        if (isProduction) return callback(new Error('Origin header required'));
        return callback(null, true);
      }
      if (allowed.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    maxAge: 600,
  })
);
app.use(cookieParser());

// Restrict /metrics to localhost only — do not expose Prometheus data publicly.
app.use(
  promMid({
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 5, 10],
    requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    metricsMiddleware: {
      middleware: (req, res, next) => {
        const allowed = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
        if (!allowed.includes(req.ip) && req.ip !== 'localhost') {
          return res.status(403).json({ error: 'Metrics endpoint not available externally' });
        }
        next();
      },
    },
  })
);

app.use(requestLogger);
app.use(requestMonitoring);

// Global rate limit (per IP). Stricter in production to make abuse expensive.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 100 : 500,
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const skipPaths = ['/api/health', '/api/search/health', '/api/search/popular', '/api/search/filters'];
      if (skipPaths.includes(req.path)) return true;
      if (req.path.startsWith('/images/') || req.path.startsWith('/fonts/')) return true;
      return false;
    },
  })
);

// CSRF protection. Mutates the body parser for web requests: we need to issue
// the CSRF cookie on safe requests, then verify it on mutations. Webhooks and
// auth bootstrap endpoints are exempted inside the middleware.
app.use(csrfProtection);

// Webhooks need the raw body to verify the Revolut signature. Mount the raw
// body parser BEFORE the JSON parser so the webhook route can use it.
app.use(
  '/api/webhooks',
  express.raw({ type: '*/*', limit: '100kb' }),
  require('./routes/webhooks')
);

// JSON parser is applied to every other route. The 10MB default is fine for
// product admin (image metadata) but is far too large for an API that
// otherwise returns < 100 KB responses — tighten to 1 MB.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks')) return next();
  express.json({ limit: '1mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  // Disable execution / sniffing of arbitrary types in the uploads folder.
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));
app.use('/fonts', express.static(path.join(__dirname, '../frontend/public/fonts')));

// All mounts under these prefixes are 100% admin operations. Enforce MFA
// at the mount point so any future route added here is automatically
// MFA-gated. Mixed routes (upload, push, orders, gdpr) have admin paths
// guarded individually with `requireAdminMfa` inside the route file.
const { authenticateToken, requireAdminMfa } = require('./middleware/auth');
const adminMfaGate = [authenticateToken, requireAdminMfa];

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/promo', require('./routes/promo'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/inventory', adminMfaGate, require('./routes/inventory'));
app.use('/api/suppliers', adminMfaGate, require('./routes/suppliers'));
app.use('/api/admin', adminMfaGate, require('./routes/admin'));
app.use('/api/admin/settings', adminMfaGate, require('./routes/settings'));
app.use('/api/upload', adminMfaGate, require('./routes/upload'));
app.use('/api/push', require('./routes/push'));
app.use('/api/amazon', adminMfaGate, require('./routes/amazon'));
app.use('/api/etsy', adminMfaGate, require('./routes/etsy'));
app.use('/api/tracking', adminMfaGate, require('./routes/tracking'));
app.use('/api/export', adminMfaGate, require('./routes/export'));
app.use('/api/sync', adminMfaGate, require('./routes/sync'));
app.use('/api/seo', adminMfaGate, require('./routes/seo'));
app.use('/api/search', adminMfaGate, require('./routes/search'));
app.use('/api/gdpr', require('./routes/gdpr'));

// Real health check. Pings DB and Redis. Returns 503 if any dependency is
// unreachable so load balancers stop routing traffic to broken instances.
const { isReady: redisReady } = require('./config/redis');
app.get('/api/health', async (req, res) => {
  const checks = { db: 'unknown', redis: 'unknown' };
  let healthy = true;
  try {
    const { query } = require('./config/database');
    await query('SELECT 1');
    checks.db = 'up';
  } catch (e) {
    checks.db = `down: ${e.message}`;
    healthy = false;
  }
  try {
    if (redisReady()) checks.redis = 'up';
    else { checks.redis = 'down'; healthy = false; }
  } catch (e) {
    checks.redis = `down: ${e.message}`;
    healthy = false;
  }
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Debug endpoints — strict NODE_ENV gate. In production these return 404 so
// they cannot be used to mutate the schema even if exposed.
if (!isProduction) {
  app.post('/api/debug/create-tables', async (req, res) => {
    try {
      const { query } = require('./config/database');
      await query(`
        CREATE TABLE IF NOT EXISTS inventory_audit_log (
          id TEXT PRIMARY KEY,
          variant_id TEXT NOT NULL,
          quantity_change INTEGER NOT NULL,
          change_type TEXT NOT NULL,
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await query('CREATE INDEX IF NOT EXISTS idx_inv_audit_variant ON inventory_audit_log(variant_id)');
      await query(`
        CREATE TABLE IF NOT EXISTS order_status_history (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          old_status TEXT,
          new_status TEXT NOT NULL,
          changed_by TEXT,
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await query('CREATE INDEX IF NOT EXISTS idx_order_status_hist_order ON order_status_history(order_id)');
      res.json({ success: true, message: 'Tables created' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/debug/add-slugs', async (req, res) => {
    try {
      const { query } = require('./config/database');
      await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE`);
      const result = await query(`
        UPDATE products SET slug = LOWER(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(name, '[^a-zA-Z0-9 ]', '', 'g'),
              ' +', '-', 'g'
            ),
            '^-|-$', '', 'g'
          )
        ) WHERE slug IS NULL
      `);
      res.json({ success: true, message: 'Slugs populated', updated: result.rowCount });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

app.use(errorLogger);
app.use(errorMonitoring);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: isProduction ? 'Internal server error' : err.message,
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

let httpServer = null;

const startServer = async () => {
  try {
    await initializeDb();
    console.log('Database initialized successfully');

    // Touch Redis so connection errors surface at startup rather than on
    // first request. This is a no-op if Redis is misconfigured — the
    // consuming middleware will log and fail-open.
    try { require('./config/redis').getRedis(); } catch (e) { /* tolerated */ }

    // Ensure critical tables exist (handles cases where migration was missed)
    try {
      const { query } = require('./config/database');
      await query(`
        CREATE TABLE IF NOT EXISTS inventory_audit_log (
          id TEXT PRIMARY KEY,
          variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
          quantity_change INTEGER NOT NULL,
          change_type TEXT NOT NULL CHECK (change_type IN ('RESERVED', 'RELEASED', 'ADJUSTMENT', 'SYNC')),
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await query('CREATE INDEX IF NOT EXISTS idx_inventory_audit_variant ON inventory_audit_log(variant_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_inventory_audit_created ON inventory_audit_log(created_at)');
      await query(`
        CREATE TABLE IF NOT EXISTS order_status_history (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          old_status TEXT,
          new_status TEXT NOT NULL,
          changed_by TEXT,
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await query('CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id)');
      console.log('Critical tables verified/created');
    } catch (e) {
      if (e.message && !e.message.includes('already exists')) {
        console.log('Table check warning:', e.message);
      } else {
        console.log('Critical tables verified/created');
      }
    }

    httpServer = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown. Called on SIGTERM (Docker stop, k8s pod termination) and
// SIGINT (Ctrl+C). Drains in-flight requests, closes DB pool and Redis, then
// exits. Bounded by a 10s force-exit so a stuck request doesn't keep the
// process alive forever.
async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully`);
  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    await shutdownDb();
    await closeRedis();
    clearTimeout(forceExit);
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
