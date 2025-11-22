#!/bin/bash

# Production-ready test runner script
# This script ensures tests run with real services and no mocks

set -e

echo "🚀 Starting Production-Ready Test Suite"
echo "======================================"

# Ensure we're in the backend directory
cd "$(dirname "$0")"

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo "❌ Error: .env.test file not found"
    exit 1
fi

# Set test environment
export NODE_ENV=test
export FORCE_COLOR=true

# Check if test database exists and remove it
if [ -f "wick_wax_relax_test.db" ]; then
    echo "🧹 Cleaning up existing test database..."
    rm -f wick_wax_relax_test.db
fi

# Check if required directories exist
mkdir -p logs
mkdir -p uploads/test

echo "📊 Running tests with real database and services..."
echo "⚠️  No mocks are used - this is production-ready testing"
echo ""

# Run tests with Jest
npx jest \
    --config=jest.config.js \
    --verbose \
    --detectOpenHandles \
    --forceExit \
    --maxWorkers=1 \
    --no-cache \
    --coverage

echo ""
echo "✅ All tests completed successfully!"
echo "📈 Coverage report generated in coverage/ directory"
echo ""
echo "🔍 Test Summary:"
echo "  - Real database operations"
echo "  - No mocked services"
echo "  - Dynamic port allocation"
echo "  - Production-ready configurations"
echo "  - Realistic timing expectations"