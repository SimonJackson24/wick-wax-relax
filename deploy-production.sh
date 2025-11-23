#!/usr/bin/env bash
set -e

# Wick Wax Relax - One-Command Production Deployment Script
# This script automates the entire deployment process on your CloudPanel VPS
# Usage: ./deploy-production.sh

echo "🚀 Starting Wick Wax Relax Production Deployment"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root or with sudo privileges
if [[ $EUID -eq 0 ]]; then
    print_error "This script should NOT be run as root. Run as your regular user with sudo privileges."
    exit 1
fi

# Check sudo access
# Use a simple sudo command to test access without the -n flag
# This will prompt for password if needed, but that's expected for sudo users
if ! sudo -v 2>/dev/null; then
    print_error "This script requires sudo privileges. Please ensure your user has sudo access."
    echo ""
    echo "To grant sudo access to your user, log in as a user with sudo privileges and run:"
    echo "  sudo usermod -aG sudo $(whoami)"
    echo ""
    echo "Then log out and log back in for the changes to take effect."
    echo "After that, run this script as your regular user (without sudo):"
    echo "  ./deploy-production.sh"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# PostgreSQL setup
echo "🔍 Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib

    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql

    print_status "PostgreSQL installed and started"
else
    print_status "PostgreSQL already installed"
fi

# Database configuration
DB_NAME="wick_wax_relax"
DB_USER="wick_wax_user"
DB_PASSWORD=""
JWT_SECRET=""
JWT_REFRESH_SECRET=""

# Generate secure passwords if not provided as environment variables
if [[ -z "${DB_PASSWORD}" ]]; then
    DB_PASSWORD=$(openssl rand -base64 32)
fi

if [[ -z "${JWT_SECRET}" ]]; then
    JWT_SECRET=$(openssl rand -base64 32)
fi

if [[ -z "${JWT_REFRESH_SECRET}" ]]; then
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
fi

# Create database and user
echo "🗄️ Setting up PostgreSQL database and user..."
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}';" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"

sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}';" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

print_status "PostgreSQL database and user configured"

# Navigate to project directory (assume we're in the project root)
cd "$SCRIPT_DIR"

# Install/update backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install/update frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Initialize PostgreSQL database with complete schema
echo "🗄️ Initializing PostgreSQL database schema..."
cd ../backend
DB_HOST=localhost \
DB_PORT=5432 \
DB_NAME=${DB_NAME} \
DB_USER=${DB_USER} \
DB_PASSWORD=${DB_PASSWORD} \
NODE_ENV=production \
npm run db:init

# Build frontend for production
echo "🔨 Building frontend..."
cd ../frontend
./node_modules/.bin/next build

# Create production environment file
echo "📝 Creating production environment file..."
cat > ../backend/.env << ENVEOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
FRONTEND_URL=https://www.wickwaxrelax.co.uk
ENVEOF

print_status "Production environment file created"

# Install PM2 if not installed
echo "🔧 Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Restart application
echo "🔄 Restarting application..."
cd ../backend
pm2 stop wick-wax-relax-api 2>/dev/null || true
pm2 delete wick-wax-relax-api 2>/dev/null || true
pm2 start server.js --name wick-wax-relax-api --env-file .env

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 15

# Health check with retry
echo "🏥 Running health check..."
for i in {1..5}; do
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        print_status "Deployment successful!"
        echo "🌐 Frontend: https://www.wickwaxrelax.co.uk"
        echo "🔗 Backend API: https://www.wickwaxrelax.co.uk/api"
        echo ""
        echo "🔐 Admin Login Credentials:"
        echo "   Email: admin@wickwaxrelax.co.uk"
        echo "   Password: admin123"
        echo ""
        echo "🔑 Your secure credentials:"
        echo "   DB_PASSWORD: ${DB_PASSWORD}"
        echo "   JWT_SECRET: ${JWT_SECRET}"
        echo "   JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}"
        echo ""
        print_warning "IMPORTANT: Save these credentials securely and change the default admin password immediately!"
        exit 0
    fi
    echo "Attempt $i failed, retrying in 5 seconds..."
    sleep 5
done

print_error "Health check failed after 5 attempts"
pm2 stop wick-wax-relax-api
exit 1
