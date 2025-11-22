module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000, // Increased timeout for real database operations
  verbose: true,
  
  // Disable automatic mocking to ensure production-ready testing
  clearMocks: true,
  restoreMocks: true,
  
  // Force real implementations
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  
  // Environment variables for tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Global setup and teardown for test database
  globalSetup: '<rootDir>/__tests__/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/globalTeardown.js',
  
  // Max workers to prevent port conflicts
  maxWorkers: 1,
  
  // Detect open handles to prevent hanging tests
  detectOpenHandles: true,
  forceExit: true
};