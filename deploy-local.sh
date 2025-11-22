#!/bin/bash

# Wick Wax Relax - Local Deployment Script
# This script sets up and runs the application locally for testing

set -e

echo "🚀 Starting Wick Wax Relax Local Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Set environment variables
export NODE_ENV=development
export PORT=3001
export FRONTEND_PORT=3000
export JWT_SECRET="local_development_jwt_secret_key_change_in_production"
export JWT_REFRESH_SECRET="local_development_refresh_secret_key_change_in_production"
export FRONTEND_URL="http://localhost:$FRONTEND_PORT"
export REDIS_URL="redis://localhost:6379"

print_status "Environment variables set for local development"

# Function to cleanup background processes
cleanup() {
    print_warning "Cleaning up background processes..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Backend setup and startup
print_status "Setting up backend..."

cd backend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
else
    print_status "Backend dependencies already installed"
fi

# Create database directory if it doesn't exist
if [ ! -d "../backend" ]; then
    mkdir -p ../backend
fi

# Initialize/check database
print_status "Initializing database..."
if [ ! -f "wick_wax_relax.db" ]; then
    print_status "Database file not found, it will be created on first run"
else
    print_success "Database file found"
fi

# Start backend server in background
print_status "Starting backend server on port $PORT..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
print_status "Waiting for backend server to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:$PORT/api/health > /dev/null; then
    print_success "Backend server is running on http://localhost:$PORT"
else
    print_error "Backend server failed to start"
    exit 1
fi

# Frontend setup and startup
print_status "Setting up frontend..."

cd ../frontend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi

# Start frontend development server in background
print_status "Starting frontend development server on port $FRONTEND_PORT..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
print_status "Waiting for frontend server to start..."
sleep 10

# Check if frontend is running
if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    print_success "Frontend server is running on http://localhost:$FRONTEND_PORT"
else
    print_warning "Frontend server may still be starting..."
fi

print_success "🎉 Wick Wax Relax is now running locally!"
echo ""
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔧 Backend API: http://localhost:$PORT"
echo "📊 API Health Check: http://localhost:$PORT/api/health"
echo ""
print_warning "Press Ctrl+C to stop the servers"

# Wait for user input
wait