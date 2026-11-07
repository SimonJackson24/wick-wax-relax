// Jest setup file for backend tests
require('dotenv').config({ path: '.env.test' });

const { getAvailablePort, getTestEnv } = require('./__tests__/test-config');

// Set test environment with dynamic port allocation
beforeAll(async () => {
  // Get available port for testing
  const testPort = await getAvailablePort(3001);
  process.env.PORT = testPort;
  
  // Set test environment variables
  const testEnv = getTestEnv();
  Object.assign(process.env, testEnv);
  
  console.log(`Test environment configured with port: ${testPort}`);
});

// Mock console methods to reduce noise during testing — but keep
// console.error REAL. The DB query wrapper logs failures via
// console.error ('[DB ERROR]' + SQL + params); mocking it hides the
// exact diagnostic needed to fix failing tests.
global.console = {
  ...console,
  // log: jest.fn(),
  // warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Set test environment
process.env.NODE_ENV = 'test';

// For production-ready testing, we use real services instead of mocks
// Email service will use test configuration or be skipped in tests

// Global test utilities
global.testUtils = {
  // Helper to create mock request object
  createMockReq: (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    get: jest.fn((header) => 'test-user-agent'),
    ...overrides
  }),

  // Helper to create mock response object
  createMockRes: (overrides = {}) => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    ...overrides
  }),

  // Helper to create mock next function
  createMockNext: () => jest.fn()
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests in a FILE. Note: this runs once per test file
// (setupFilesAfterEach), NOT once per Jest run. The database schema must
// SURVIVE between files — dropping it here (as this once did via
// cleanupTestDb) left every subsequent test file running against an empty
// database, cascading failures through auth/integration/security suites.
// Full schema teardown belongs to globalTeardown only.
afterAll(async () => {
  // Close any open database connections
  const { query } = require('./config/database');
  if (query.end) {
    await query.end();
  }
});