// Logger service tests.
//
// These spy on the REAL exported winston loggers rather than mocking the
// winston module: the previous version mocked winston at module level and
// then asserted on the mock's import-time call history, which
// jest.clearAllMocks() wiped before every assertion — every test failed
// with "createLogger not called" / "undefined.error". Spying on the real
// instances tests actual middleware behaviour (finish events, PII
// sanitisation, formatting) and is immune to mock-shape drift.
//
// Winston writes to backend/logs/ (gitignored); console transport output
// is expected noise.

const {
  logger,
  performanceLogger,
  requestLogger,
  errorLogger,
  performanceMonitor,
} = require('../../services/logger');

describe('Logger Service', () => {
  let httpSpy;
  let warnSpy;
  let errorSpy;
  let perfInfoSpy;
  let perfWarnSpy;

  beforeEach(() => {
    httpSpy = jest.spyOn(logger, 'http').mockImplementation(() => {});
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    perfInfoSpy = jest.spyOn(performanceLogger, 'info').mockImplementation(() => {});
    perfWarnSpy = jest.spyOn(performanceLogger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('module shape', () => {
    it('exports logger and performanceLogger instances', () => {
      expect(logger).toBeDefined();
      expect(performanceLogger).toBeDefined();
      expect(typeof logger.error).toBe('function');
      expect(typeof performanceLogger.info).toBe('function');
    });
  });

  describe('requestLogger', () => {
    let mockReq, mockRes, mockNext, finishCallback;

    beforeEach(() => {
      finishCallback = null;
      mockReq = {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(() => 'Mozilla/5.0'),
        user: { id: 'user-1' },
      };
      mockRes = {
        statusCode: 200,
        on: jest.fn((event, cb) => {
          if (event === 'finish') finishCallback = cb;
        }),
      };
      mockNext = jest.fn();
    });

    it('should log successful requests on finish', () => {
      requestLogger(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled(); // must not block the request
      expect(httpSpy).not.toHaveBeenCalled(); // not before finish

      finishCallback();
      expect(httpSpy).toHaveBeenCalledWith('Request completed', expect.objectContaining({
        method: 'GET',
        url: '/api/test',
        status: 200,
        userId: 'user-1',
      }));
    });

    it('should log error-status requests as warnings', () => {
      mockRes.statusCode = 404;

      requestLogger(mockReq, mockRes, mockNext);
      finishCallback();

      expect(warnSpy).toHaveBeenCalledWith('Request completed with error', expect.objectContaining({
        method: 'GET',
        url: '/api/test',
        status: 404,
      }));
      expect(httpSpy).not.toHaveBeenCalled();
    });

    it('should handle anonymous users', () => {
      delete mockReq.user;

      requestLogger(mockReq, mockRes, mockNext);
      finishCallback();

      expect(httpSpy).toHaveBeenCalledWith('Request completed', expect.objectContaining({
        userId: 'anonymous',
      }));
    });

    it('should flag slow requests to the performance logger', () => {
      const nowSpy = jest.spyOn(Date, 'now');
      const t0 = 1000000;
      nowSpy.mockReturnValue(t0); // request starts at t0

      requestLogger(mockReq, mockRes, mockNext);
      nowSpy.mockReturnValue(t0 + 2500); // finish fires 2.5s later
      finishCallback();

      expect(perfWarnSpy).toHaveBeenCalledWith('Slow request detected', expect.objectContaining({
        threshold: '1000ms',
      }));
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
        user: { id: 'user-1' },
        body: { test: 'data', email: 'person@example.com' },
        query: { param: 'value' },
        params: { id: '123' },
      };
      mockRes = {};
      mockNext = jest.fn();
    });

    it('should log errors with full context and pass the error on', () => {
      const testError = new Error('Test error');

      errorLogger(testError, mockReq, mockRes, mockNext);

      expect(errorSpy).toHaveBeenCalledWith('Application error', expect.objectContaining({
        message: 'Test error',
        method: 'POST',
        url: '/api/test',
        userId: 'user-1',
        query: { param: 'value' },
        params: { id: '123' },
      }));
      // Body goes through the PII sanitizer — email must not leak raw.
      const logged = errorSpy.mock.calls[0][1];
      expect(JSON.stringify(logged.body)).not.toContain('person@example.com');

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should handle anonymous users', () => {
      delete mockReq.user;
      const testError = new Error('Test error');

      errorLogger(testError, mockReq, mockRes, mockNext);

      expect(errorSpy).toHaveBeenCalledWith('Application error', expect.objectContaining({
        userId: 'anonymous',
      }));
    });
  });

  describe('performanceMonitor', () => {
    it('startTimer returns an object with a working end()', () => {
      const timer = performanceMonitor.startTimer('test-operation');

      expect(typeof timer.end).toBe('function');
      const duration = timer.end();
      expect(typeof duration).toBe('number');
      expect(perfInfoSpy).toHaveBeenCalledWith('Performance measurement', expect.objectContaining({
        label: 'test-operation',
      }));
    });

    it('logDatabaseQuery logs fast queries as info', () => {
      performanceMonitor.logDatabaseQuery('SELECT * FROM users', 50, true);

      expect(perfInfoSpy).toHaveBeenCalledWith('Database query', expect.objectContaining({
        duration: '50.00ms',
        success: true,
      }));
    });

    it('logDatabaseQuery logs slow queries as warnings', () => {
      performanceMonitor.logDatabaseQuery('SELECT * FROM users', 150, true);

      expect(perfWarnSpy).toHaveBeenCalledWith('Slow database query', expect.objectContaining({
        duration: '150.00ms',
      }));
    });

    it('logMemoryUsage formats memory statistics', () => {
      const mockMemoryUsage = {
        rss: 50 * 1024 * 1024,
        heapTotal: 30 * 1024 * 1024,
        heapUsed: 20 * 1024 * 1024,
        external: 5 * 1024 * 1024,
      };
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

      performanceMonitor.logMemoryUsage();

      expect(perfInfoSpy).toHaveBeenCalledWith('Memory usage', expect.objectContaining({
        rss: '50.00MB',
        heapTotal: '30.00MB',
        heapUsed: '20.00MB',
        external: '5.00MB',
      }));
    });
  });
});
