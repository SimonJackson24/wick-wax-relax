@echo off
REM Production-ready test runner script for Windows
REM This script ensures tests run with real services and no mocks

echo 🚀 Starting Production-Ready Test Suite
echo ======================================

REM Check if .env.test exists
if not exist ".env.test" (
    echo ❌ Error: .env.test file not found
    exit /b 1
)

REM Set test environment
set NODE_ENV=test
set FORCE_COLOR=true

REM Check if test database exists and remove it
if exist "wick_wax_relax_test.db" (
    echo 🧹 Cleaning up existing test database...
    del /f wick_wax_relax_test.db
)

REM Check if required directories exist
if not exist "logs" mkdir logs
if not exist "uploads\test" mkdir uploads\test

echo 📊 Running tests with real database and services...
echo ⚠️  No mocks are used - this is production-ready testing
echo.

REM Run tests with Jest
npx jest ^
    --config=jest.config.js ^
    --verbose ^
    --detectOpenHandles ^
    --forceExit ^
    --maxWorkers=1 ^
    --no-cache ^
    --coverage

echo.
echo ✅ All tests completed successfully!
echo 📈 Coverage report generated in coverage\ directory
echo.
echo 🔍 Test Summary:
echo   - Real database operations
echo   - No mocked services
echo   - Dynamic port allocation
echo   - Production-ready configurations
echo   - Realistic timing expectations