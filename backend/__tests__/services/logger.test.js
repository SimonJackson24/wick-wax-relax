// Mock winston-daily-rotate-file first
jest.mock('winston-daily-rotate-file', () => jest.fn(() => ({})));

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    http: jest.fn(),
    add: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(() => ({})),
    errors: jest.fn(() => ({})),
    json: jest.fn(),
    colorize: jest.fn(() => ({})),
    printf: jest.fn(() => ({}))
  },
  transports: {
    Console: jest.fn(),
    DailyRotateFile: jest.fn()
  },
  addColors: jest.fn()
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn()
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  basename: jest.fn((path) => path.split('/').pop())
}));

const { logger, performanceLogger, requestLogger, errorLogger, performanceMonitor } = require('../../services/logger');

describe('Logger Service', () => {
  let mockLogger, mockPerformanceLogger;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked logger instances
    mockLogger = require('winston').createLogger.mock.results[0]?.value;
    mockPerformanceLogger = require('winston').createLogger.mock.results[1]?.value;
  });

  describe('Logger Configuration', () => {
    it('should create main logger with correct configuration', () => {
      expect(require('winston').createLogger).toHaveBeenCalled();
      expect(mockLogger).toBeDefined();
    });

    it('should create performance logger with correct configuration', () => {
      expect(require('winston').createLogger).toHaveBeenCalledTimes(2);
      expect(mockPerformanceLogger).toBeDefined();
    });
  });

  describe('requestLogger', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(() => 'Mozilla/5.0'),
        user: { id: 1 }
      };

      mockRes = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10); // Simulate async finish
          }
        })
      };

      mockNext = jest.fn();
    });

    it('should log successful requests', () => {
      requestLogger(mockReq, mockRes, mockNext);

      // Wait for the finish event
      setTimeout(() => {
        expect(mockLogger.http).toHaveBeenCalledWith('Request completed', expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          status: 200,
          userId: 1
        }));
      }, 20);
    });

    it('should log error requests', () => {
      mockRes.statusCode = 404;

      requestLogger(mockReq, mockRes, mockNext);

      setTimeout(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith('Request completed with error', expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          status: 404
        }));
      }, 20);
    });

    it('should handle anonymous users', () => {
      delete mockReq.user;

      requestLogger(mockReq, mockRes, mockNext);

      setTimeout(() => {
        expect(mockLogger.http).toHaveBeenCalledWith('Request completed', expect.objectContaining({
          userId: 'anonymous'
        }));
      }, 20);
    });
  });

  describe('errorLogger', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        method: 'POST',
        url: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(() => 'Mozilla/5.0'),
        user: { id: 1 },
        body: { test: 'data' },
        query: { param: 'value' },
        params: { id: '123' }
      };

      mockRes = {};
      mockNext = jest.fn();
    });

    it('should log errors with full context', () => {
      const testError = new Error('Test error');

      errorLogger(testError, mockReq, mockRes, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith('Application error', expect.objectContaining({
        message: 'Test error',
        method: 'POST',
        url: '/api/test',
        userId: 1,
        body: { test: 'data' },
        query: { param: 'value' },
        params: { id: '123' }
      }));

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should handle anonymous users in error logging', () => {
      delete mockReq.user;
      const testError = new Error('Test error');

      errorLogger(testError, mockReq, mockRes, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith('Application error', expect.objectContaining({
        userId: 'anonymous'
      }));
    });
  });

  describe('performanceMonitor', () => {
    describe('startTimer', () => {
      it('should create and return timer object', () => {
        const timer = performanceMonitor.startTimer('test-operation');

        expect(timer).toHaveProperty('end');
        expect(typeof timer.end).toBe('function');
      });
    });

    describe('logDatabaseQuery', () => {
      it('should log successful fast queries', () => {
        performanceMonitor.logDatabaseQuery('SELECT * FROM users', 50, true);

        expect(mockPerformanceLogger.info).toHaveBeenCalledWith('Database query', expect.objectContaining({
          duration: '50.000ms',
          success: true
        }));
      });

      it('should log slow queries as warnings', () => {
        performanceMonitor.logDatabaseQuery('SELECT * FROM users', 150, true);

        expect(mockPerformanceLogger.warn).toHaveBeenCalledWith('Slow database query', expect.objectContaining({
          duration: '150.000ms'
        }));
      });
    });

    describe('logMemoryUsage', () => {
      it('should log memory usage statistics', () => {
        const mockMemoryUsage = {
          rss: 50 * 1024 * 1024, // 50MB
          heapTotal: 30 * 1024 * 1024, // 30MB
          heapUsed: 20 * 1024 * 1024, // 20MB
          external: 5 * 1024 * 1024 // 5MB
        };

        jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

        performanceMonitor.logMemoryUsage();

        expect(mockPerformanceLogger.info).toHaveBeenCalledWith('Memory usage', expect.objectContaining({
          rss: '50.00MB',
          heapTotal: '30.00MB',
          heapUsed: '20.00MB',
          external: '5.00MB'
        }));

        jest.restoreAllMocks();
      });
    });
  });
});