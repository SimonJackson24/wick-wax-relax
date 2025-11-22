// Test configuration for handling environment-specific settings
const net = require('net');
const path = require('path');

// Get available port for testing
const getAvailablePort = (startPort = 3001) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });

    server.on('error', () => {
      // If port is in use, try next port
      resolve(getAvailablePort(startPort + 1));
    });
  });
};

// Test database configuration
const getTestDbConfig = () => {
  return {
    filename: path.resolve(__dirname, '../wick_wax_relax_test.db'),
    driver: require('sqlite3').verbose().Database
  };
};

// Test environment variables
const getTestEnv = () => {
  return {
    NODE_ENV: 'test',
    JWT_SECRET: 'test_jwt_secret_for_testing_only',
    JWT_REFRESH_SECRET: 'test_refresh_secret_for_testing_only',
    FRONTEND_URL: 'http://localhost:3000',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    REVOLUT_API_KEY: process.env.REVOLUT_API_KEY || 'test_api_key',
    REVOLUT_WEBHOOK_SECRET: process.env.REVOLUT_WEBHOOK_SECRET || 'test_webhook_secret'
  };
};

// Clean up test database
const cleanupTestDb = async () => {
  const fs = require('fs');
  const testDbPath = getTestDbConfig().filename;

  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  } catch (error) {
    console.warn('Could not clean up test database:', error.message);
  }
};

module.exports = {
  getAvailablePort,
  getTestDbConfig,
  getTestEnv,
  cleanupTestDb
};