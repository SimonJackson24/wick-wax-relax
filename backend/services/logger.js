const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wick-wax-relax-backend' },
  transports: [
    // Error log file
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),

    // Combined log file
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),

    // HTTP log file
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  }));
}

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Performance monitoring logger
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wick-wax-relax-performance' },
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.http('Request completed', logData);
    }

    // Log performance metrics
    if (duration > 1000) { // Log slow requests (> 1 second)
      performanceLogger.warn('Slow request detected', {
        ...logData,
        threshold: '1000ms'
      });
    }
  });

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  const logData = {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id || 'anonymous',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params
  };

  logger.error('Application error', logData);
  next(error);
};

// Performance monitoring functions
const performanceMonitor = {
  // Start timing a function
  startTimer: (label) => {
    const startTime = process.hrtime.bigint();
    return {
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        performanceLogger.info('Performance measurement', {
          label,
          duration: `${duration.toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
        return duration;
      }
    };
  },

  // Log database query performance
  logDatabaseQuery: (query, duration, success = true) => {
    const logData = {
      type: 'database_query',
      query: query.substring(0, 500), // Truncate long queries
      duration: `${duration.toFixed(2)}ms`,
      success
    };

    if (duration > 100) { // Log slow queries
      performanceLogger.warn('Slow database query', logData);
    } else {
      performanceLogger.info('Database query', logData);
    }
  },

  // Log API call performance
  logApiCall: (service, endpoint, method, duration, statusCode, success = true) => {
    const logData = {
      type: 'api_call',
      service,
      endpoint,
      method,
      duration: `${duration.toFixed(2)}ms`,
      statusCode,
      success
    };

    if (!success || statusCode >= 400) {
      performanceLogger.warn('API call issue', logData);
    } else {
      performanceLogger.info('API call', logData);
    }
  },

  // Log memory usage
  logMemoryUsage: () => {
    const memUsage = process.memoryUsage();
    performanceLogger.info('Memory usage', {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`
    });
  }
};

module.exports = {
  logger,
  performanceLogger,
  requestLogger,
  errorLogger,
  performanceMonitor
};