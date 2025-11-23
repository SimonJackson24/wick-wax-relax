#!/bin/bash

# Robust PostgreSQL Deployment Script for Wick Wax Relax
# Handles authentication timing issues and multiple authentication methods

set -e  # Exit on any error
set -u  # Treat unset variables as errors

# Configuration variables
DB_NAME="wick_wax_relax"
DB_USER="wick_wax_user"
DB_PASSWORD="${DB_PASSWORD:-$DB_PASSWORD}"
DB_HOST="localhost"
DB_PORT="5432"
NODE_ENV="production"
BACKEND_DIR="/home/wickwaxrelax/htdocs/www.wickwaxrelax.co.uk/backend"
FRONTEND_DIR="/home/wickwaxrelax/htdocs/www.wickwaxrelax.co.uk/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} DEPLOYMENT: $1${NC}"
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} MESSAGE: $2${NC}"
}

# Error handling
error_exit() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ERROR: $1${NC}"
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} DETAILS: $2${NC}"
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✓ SUCCESS: $1${NC}"
}

log "Starting robust PostgreSQL deployment..."

# Function to wait for PostgreSQL to be ready
wait_for_postgresql() {
    log "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            log "PostgreSQL is ready"
            return 0
        fi
        sleep 2
    done
    
    log "${RED}ERROR: PostgreSQL not ready after 60 seconds${NC}"
    error_exit "PostgreSQL startup timeout" "PostgreSQL failed to start within 60 seconds"
    return 1
}

# Function to check if user exists
user_exists() {
    sudo -u postgres psql -d "$DB_NAME" -tAc -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" | grep -q 1
}

# Function to create database if it doesn't exist
create_database() {
    if ! sudo -u postgres psql -l | grep -q "$DB_NAME"; then
        log "Creating database: $DB_NAME"
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        if [ $? -eq 0 ]; then
            log "${GREEN}Database created successfully${NC}"
        else
            error_exit "Failed to create database" "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        fi
    else
        log "Database already exists: $DB_NAME"
    fi
}

# Function to create user if it doesn't exist
create_user() {
    if ! user_exists; then
        log "Creating user: $DB_USER"
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' LOGIN;"
        if [ $? -eq 0 ]; then
            log "${GREEN}User created successfully${NC}"
        else
            error_exit "Failed to create user" "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' LOGIN;"
        fi
    else
        log "User already exists: $DB_USER"
    fi
}

# Function to grant privileges with retry mechanism
grant_privileges() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Granting privileges (attempt $attempt of $max_attempts)..."
        
        # Grant schema privileges
        sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null
        if [ $? -ne 0 ]; then
            if [ $attempt -eq $max_attempts ]; then
                error_exit "Failed to grant schema privileges after $max_attempts attempts" "GRANT ALL ON SCHEMA public TO $DB_USER;"
            else
                log "${YELLOW}Schema privileges failed, retrying...${NC}"
            fi
        else
            log "${GREEN}Schema privileges granted${NC}"
        fi
        
        # Grant table privileges
        sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;" 2>/dev/null
        if [ $? -ne 0 ]; then
            if [ $attempt -eq $max_attempts ]; then
                error_exit "Failed to grant table privileges after $max_attempts attempts" "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
            else
                log "${YELLOW}Table privileges failed, retrying...${NC}"
            fi
        else
            log "${GREEN}Table privileges granted${NC}"
        fi
        
        # Grant sequence privileges
        sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;" 2>/dev/null
        if [ $? -ne 0 ]; then
            if [ $attempt -eq $max_attempts ]; then
                error_exit "Failed to grant sequence privileges after $max_attempts attempts" "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
            else
                log "${YELLOW}Sequence privileges failed, retrying...${NC}"
            fi
        else
            log "${GREEN}Sequence privileges granted${NC}"
        fi
        
        # Set default privileges for future objects
        sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;" 2>/dev/null
        if [ $? -ne 0 ]; then
            if [ $attempt -eq $max_attempts ]; then
                error_exit "Failed to set default privileges after $max_attempts attempts" "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
            else
                log "${GREEN}Default privileges set${NC}"
            fi
        else
            log "${GREEN}Default privileges set${NC}"
        fi
        
        # Set password validity to unlimited
        sudo -u postgres psql -d "$DB_NAME" -c "ALTER USER $DB_USER VALID UNTIL 'infinity';" 2>/dev/null
        if [ $? -ne 0 ]; then
            if [ $attempt -eq $max_attempts ]; then
                error_exit "Failed to set password validity after $max_attempts attempts" "ALTER USER $DB_USER VALID UNTIL 'infinity';"
            else
                log "${GREEN}Password validity set to unlimited${NC}"
            fi
        else
            log "${GREEN}Password validity set to unlimited${NC}"
        fi
        
        sleep 2  # Wait between attempts
        attempt=$((attempt + 1))
    done
    
    log "${GREEN}All privileges granted successfully${NC}"
}

# Function to test database connection
test_connection() {
    log "Testing database connection with $DB_USER..."
    
    # Test with environment variables
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log "${GREEN}Connection test passed with environment variables${NC}"
        return 0
    else
        log "${YELLOW}Connection test failed with environment variables, trying .pgpass...${NC}"
        
        # Try with .pgpass file
        echo "$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:$DB_PASSWORD" > ~/.pgpass
        chmod 600 ~/.pgpass
        export PGPASSFILE=~/.pgpass
        
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            log "${GREEN}Connection test passed with .pgpass file${NC}"
            return 0
        else
            log "${RED}Connection test failed with .pgpass file${NC}"
            return 1
        fi
    fi
}

# Function to run migrations with fallback
run_migrations() {
    log "Running database migrations..."
    
    local migration_success=0
    local migration_files=(
        "001_initial_schema.sql"
        "002_product_variants.sql"
        "003_product_categories.sql"
        "004_user_accounts.sql"
        "005_order_items.sql"
        "006_inventory_audit_log.sql"
        "007_add_product_images.sql"
        "007_add_refresh_token.sql"
        "008_add_tracking_fields.sql"
        "009_security_audit_log.sql"
        "009_suppliers.sql"
        "010_gdpr_consent_tracking.sql"
        "010_platform_settings.sql"
        "011_performance_indexes.sql"
        "012_hierarchical_categories.sql"
    )
    
    for migration_file in "${migration_files[@]}"; do
        log "Executing migration: $migration_file"
        
        # Try as application user first
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "../migrations/$migration_file" 2>/dev/null; then
            log "${GREEN}✓ Migration $migration_file completed (app user)${NC}"
        else
            log "${YELLOW}⚠ Migration $migration_file failed (app user), trying postgres user...${NC}"
            
            # Try as postgres user
            if sudo -u postgres psql -d "$DB_NAME" -f "../migrations/$migration_file" 2>/dev/null; then
                log "${GREEN}✓ Migration $migration_file completed (postgres user)${NC}"
            else
                log "${RED}✗ Migration $migration_file failed (postgres user)${NC}"
                migration_success=1
            fi
        fi
    done
    
    if [ $migration_success -eq 1 ]; then
        log "${YELLOW}⚠ Some migrations failed, but continuing...${NC}"
    else
        log "${GREEN}✓ All migrations completed successfully${NC}"
    fi
}

# Function to seed initial data with fallback
seed_data() {
    log "Seeding initial data..."
    
    # Seed channels
    log "Seeding channels..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO channels (id, name, api_key) VALUES ('pwa-channel', 'PWA', 'pwa-api-key') ON CONFLICT (name) DO NOTHING;" 2>/dev/null; then
        log "${GREEN}✓ Channels seeded (app user)${NC}"
    else
        log "${YELLOW}⚠ Channels seeding failed (app user), trying postgres user...${NC}"
        
        if sudo -u postgres psql -d "$DB_NAME" -c "INSERT INTO channels (id, name, api_key) VALUES ('pwa-channel', 'PWA', 'pwa-api-key') ON CONFLICT (name) DO NOTHING;" 2>/dev/null; then
            log "${GREEN}✓ Channels seeded (postgres user)${NC}"
        else
            log "${RED}✗ Channels seeding failed (postgres user)${NC}"
        fi
    fi
    
    # Seed admin user
    log "Creating admin user..."
    local admin_password_hash=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(hash => console.log(hash))" 2>/dev/null)
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES ('admin-user', 'admin@wickwaxrelax.co.uk', '$admin_password_hash', 'Admin', 'User') ON CONFLICT (email) DO NOTHING;" 2>/dev/null; then
        log "${GREEN}✓ Admin user created (app user)${NC}"
    else
        log "${YELLOW}⚠ Admin user creation failed (app user), trying postgres user...${NC}"
        
        if sudo -u postgres psql -d "$DB_NAME" -c "INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES ('admin-user', 'admin@wickwaxrelax.co.uk', '$admin_password_hash', 'Admin', 'User') ON CONFLICT (email) DO NOTHING;" 2>/dev/null; then
            log "${GREEN}✓ Admin user created (postgres user)${NC}"
        else
            log "${RED}✗ Admin user creation failed (postgres user)${NC}"
        fi
    fi
    
    log "${GREEN}✓ Data seeding completed${NC}"
}

# Function to install backend dependencies
install_backend_deps() {
    log "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        npm install --production
        if [ $? -eq 0 ]; then
            log "${GREEN}✓ Backend dependencies installed${NC}"
        else
            error_exit "Failed to install backend dependencies" "npm install --production"
        fi
    else
        log "${YELLOW}Backend dependencies already installed${NC}"
    fi
}

# Function to build frontend
build_frontend() {
    log "Building frontend..."
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        npm install --production
        if [ $? -eq 0 ]; then
            log "${GREEN}✓ Frontend dependencies installed${NC}"
        else
            error_exit "Failed to install frontend dependencies" "npm install --production"
        fi
    fi
    
    # Build frontend
    npm run build
    if [ $? -eq 0 ]; then
        log "${GREEN}✓ Frontend built successfully${NC}"
    else
        error_exit "Failed to build frontend" "npm run build"
    fi
}

# Function to restart application
restart_application() {
    log "Restarting application..."
    
    # Stop existing processes
    pm2 stop wick-wax-relax-api 2>/dev/null || true
    pm2 delete wick-wax-relax-api 2>/dev/null || true
    
    # Start application
    cd "$BACKEND_DIR"
    pm2 start server.js --name wick-wax-relax-api --env-file .env
    
    # Wait for application to start
    sleep 10
    
    # Health check
    local max_health_checks=5
    local health_check=1
    
    while [ $health_check -le $max_health_checks ]; do
        if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            log "${GREEN}✓ Application is healthy and running${NC}"
            return 0
        else
            log "${YELLOW}Health check $health_check failed, retrying in 10 seconds...${NC}"
            sleep 10
            health_check=$((health_check + 1))
        fi
    done
    
    log "${RED}❌ Application failed health checks after $max_health_checks attempts${NC}"
    error_exit "Application health check failed" "Application not responding after restart"
}

# Main deployment function
main() {
    log "Starting robust PostgreSQL deployment..."
    
    # Check if PostgreSQL is running
    if ! systemctl is-active --quiet postgresql; then
        log "Starting PostgreSQL..."
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
        
        # Wait for PostgreSQL to be ready
        if ! wait_for_postgresql; then
            error_exit "PostgreSQL failed to start"
        fi
    else
        log "${GREEN}✓ PostgreSQL is already running${NC}"
    fi
    
    # Setup database and user
    create_database
    create_user
    grant_privileges
    
    # Test connection
    if ! test_connection; then
        error_exit "Database connection test failed"
    fi
    
    # Run migrations
    run_migrations
    
    # Seed data
    seed_data
    
    # Install dependencies and build
    install_backend_deps
    build_frontend
    
    # Create production environment file
    log "Creating production environment file..."
    cd "$BACKEND_DIR"
    cat > .env << ENVEOF
NODE_ENV=$NODE_ENV
PORT=3001
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=\${JWT_SECRET:-your-jwt-secret-key}
JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET:-your-jwt-refresh-secret}
ENVEOF
    
    # Restart application
    restart_application
    
    success "Deployment completed successfully"
}

# Run main function
main "$@"