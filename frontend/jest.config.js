const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // jest.setup.js carries the jsdom polyfills (matchMedia, observers,
  // next/* mocks) and jest.accessibility.js the shared axe config. Both
  // are needed; the config listed only the second, so the polyfills
  // never loaded.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.accessibility.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'pages/**/*.{js,jsx}',
    '!pages/_app.js',
    '!pages/_document.js',
    '!pages/api/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(js|jsx)',
    '**/*.(test|spec).(js|jsx)',
  ],
  // tests/e2e holds Playwright specs — they need @playwright/test and a
  // running server, not Jest. They were being collected by Jest and
  // failing the whole run.
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);