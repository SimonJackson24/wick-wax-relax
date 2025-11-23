const { cleanupTestDb, initializeTestDb } = require('./test-config');

module.exports = async () => {
  console.log('Setting up PostgreSQL test environment...');

  // Clean up any existing test database data
  await cleanupTestDb();

  // Initialize fresh test database with schema
  try {
    await initializeTestDb();
    console.log('PostgreSQL test database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize PostgreSQL test database:', error);
    throw error;
  }
};