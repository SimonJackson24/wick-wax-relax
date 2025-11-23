#!/bin/bash

# Autonomous Docker Deployment Script for Wick Wax Relax
# Performs complete environment assessment, service orchestration, and credential management

set -e  # Exit on any error
set -u  # Treat unset variables as errors

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} DEPLOYMENT: $1${NC}"
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} DETAILS: $2${NC}"
}

# Error handling
error_exit() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ERROR: $1${NC}"
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} DETAILS: $2${NC}"
    cleanup_on_error
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✓ SUCCESS: $1${NC}"
}

# Warning message
warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠ WARNING: $1${NC}"
}

# Info message
info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ℹ INFO: $1${NC}"
}

# Cleanup on error
cleanup_on_error() {
    log "Cleaning up on error..."
    docker-compose -f docker-compose.autonomous.yml down --remove-orphans 2>/dev/null || true
}

# Generate cryptographically secure random string
generate_secure_string() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Detect hosting environment
detect_environment() {
    log "Detecting hosting environment..."
    
    # System information
    export SYSTEM_INFO=$(uname -a 2>/dev/null || echo "Unknown")
    export CPU_CORES=$(nproc 2>/dev/null || echo "Unknown")
    export TOTAL_MEMORY=$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}' || echo "Unknown")
    export AVAILABLE_DISK=$(df -h / 2>/dev/null | awk 'NR==2 {print $4}' || echo "Unknown")
    export DOCKER_VERSION=$(docker --version 2>/dev/null | awk '{print $3}' | tr -d ','' 2>/dev/null || echo "Unknown")
    export OS_INFO=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 2>/dev/null || echo "Unknown")
    
    info "System: $OS_INFO"
    info "CPU Cores: $CPU_CORES"
    info "Total Memory: $TOTAL_MEMORY"
    info "Available Disk: $AVAILABLE_DISK"
    info "Docker Version: $DOCKER_VERSION"
    
    # Check if system meets minimum requirements
    if [ "$CPU_CORES" -lt 2 ]; then
        warning "System has less than 2 CPU cores, performance may be limited"
    fi
    
    if [[ "$TOTAL_MEMORY" < *"G"* ]]; then
        MEMORY_GB=$(echo "$TOTAL_MEMORY" | sed 's/G//')
        if [ "$MEMORY_GB" -lt 4 ]; then
            warning "System has less than 4GB RAM, performance may be limited"
        fi
    fi
    
    if [[ "$AVAILABLE_DISK" < *"G"* ]]; then
        DISK_GB=$(echo "$AVAILABLE_DISK" | sed 's/G//')
        if [ "$DISK_GB" -lt 20 ]; then
            error_exit "Insufficient disk space" "At least 20GB required, only $AVAILABLE_DISK available"
        fi
    fi
}

# Allocate unused ports
allocate_ports() {
    log "Allocating unused ports..."
    
    # Frontend port (3000-3099 range)
    for port in {3000..3099}; do
        if ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
            export FRONTEND_PORT=$port
            break
        fi
    done
    
    # Backend port (8000-8099 range)
    for port in {8000..8099}; do
        if ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
            export BACKEND_PORT=$port
            break
        fi
    done
    
    # PostgreSQL port (5432 is default, check if available)
    if netstat -tuln 2>/dev/null | grep -q ":5432 "; then
        for port in {5433..5499}; do
            if ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
                export POSTGRES_PORT=$port
                break
            fi
        done
    else
        export POSTGRES_PORT=5432
    fi
    
    # Redis port (6379 is default, check if available)
    if netstat -tuln 2>/dev/null | grep -q ":6379 "; then
        for port in {6380..6399}; do
            if ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
                export REDIS_PORT=$port
                break
            fi
        done
    else
        export REDIS_PORT=6379
    fi
    
    info "Frontend Port: $FRONTEND_PORT"
    info "Backend Port: $BACKEND_PORT"
    info "PostgreSQL Port: $POSTGRES_PORT"
    info "Redis Port: $REDIS_PORT"
}

# Generate secure credentials
generate_credentials() {
    log "Generating secure credentials..."
    
    # Database credentials
    export POSTGRES_USER="wick_wax_user_$(date +%s)"
    export POSTGRES_PASSWORD=$(generate_secure_string 24)
    export POSTGRES_DB="wick_wax_relax"
    export POSTGRES_ADMIN_USER="postgres_admin"
    export POSTGRES_ADMIN_PASSWORD=$(generate_secure_string 24)
    
    # Redis credentials
    export REDIS_PASSWORD=$(generate_secure_string 16)
    
    # JWT secrets
    export JWT_SECRET=$(generate_secure_string 64)
    export JWT_REFRESH_SECRET=$(generate_secure_string 64)
    
    # Application secrets
    export APP_SECRET_KEY=$(generate_secure_string 32)
    export ENCRYPTION_KEY=$(generate_secure_string 32)
    
    # Admin user credentials
    export ADMIN_EMAIL="admin@wickwaxrelax.co.uk"
    export ADMIN_PASSWORD=$(generate_secure_string 16)
    
    success "All credentials generated securely"
}

# Create Docker Compose file
create_docker_compose() {
    log "Creating Docker Compose configuration..."
    
    cat > docker-compose.autonomous.yml << EOF
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: wick-wax-postgres
    environment:
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "\${POSTGRES_PORT}:5432"
    networks:
      - wick-wax-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER} -d \${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: wick-wax-redis
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "\${REDIS_PORT}:6379"
    networks:
      - wick-wax-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: wick-wax-backend
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: \${POSTGRES_DB}
      DB_USER: \${POSTGRES_USER}
      DB_PASSWORD: \${POSTGRES_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: \${REDIS_PASSWORD}
      JWT_SECRET: \${JWT_SECRET}
      JWT_REFRESH_SECRET: \${JWT_REFRESH_SECRET}
      APP_SECRET_KEY: \${APP_SECRET_KEY}
      ENCRYPTION_KEY: \${ENCRYPTION_KEY}
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "\${BACKEND_PORT}:3001"
    networks:
      - wick-wax-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wick-wax-frontend
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://localhost:\${BACKEND_PORT}
      NEXT_PUBLIC_APP_NAME: "Wick Wax Relax"
      NEXT_PUBLIC_APP_DESCRIPTION: "Luxury bath and body products"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "\${FRONTEND_PORT}:3000"
    networks:
      - wick-wax-network
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: wick-wax-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    networks:
      - wick-wax-network
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  wick-wax-network:
    driver: bridge
EOF

    success "Docker Compose configuration created"
}

# Create Nginx configuration
create_nginx_config() {
    log "Creating Nginx configuration..."
    
    mkdir -p nginx ssl
    
    cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=one:10r/s;

    server {
        listen 80;
        server_name localhost;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # Rate limiting
        limit_req zone=one burst=20 nodelay;
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # API specific settings
            client_max_body_size 10M;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # HTTPS configuration (if SSL certificates are available)
    server {
        listen 443 ssl http2;
        server_name localhost;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;
        
        # Same proxy configuration as HTTP
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            client_max_body_size 10M;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }
    }
}
EOF

    success "Nginx configuration created"
}

# Create backend Dockerfile
create_backend_dockerfile() {
    log "Creating backend Dockerfile..."
    
    cat > backend/Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \\
  CMD curl -f http://localhost:3001/api/health || exit 1

EXPOSE 3001

CMD ["npm", "start"]
EOF

    success "Backend Dockerfile created"
}

# Create frontend Dockerfile
create_frontend_dockerfile() {
    log "Creating frontend Dockerfile..."
    
    cat > frontend/Dockerfile << EOF
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine as runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.cache/next ./node_modules/.cache/next

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \\
  CMD curl -f http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["npm", "start"]
EOF

    success "Frontend Dockerfile created"
}

# Create missing migration files
create_missing_migrations() {
    log "Checking for missing migration files..."
    
    # Check if 001_initial_schema.sql exists, if not create it
    if [ ! -f "migrations/001_initial_schema.sql" ]; then
        info "Creating 001_initial_schema.sql..."
        cat > migrations/001_initial_schema.sql << EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sales channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('AMAZON', 'PWA', 'ETSY')),
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scent_profile JSONB NOT NULL,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory tracking
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, channel_id)
);

-- Create orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  external_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  total NUMERIC(10,2) NOT NULL,
  UNIQUE(channel_id, external_id)
);

-- Create payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('APPLE_PAY', 'GOOGLE_PAY', 'KLARNA', 'CLEARPAY')),
  revolut_payment_id VARCHAR(255) NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCEEDED', 'REQUIRES_ACTION', 'CANCELED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_channel ON inventory(channel_id);
CREATE INDEX idx_orders_channel ON orders(channel_id);
CREATE INDEX idx_payments_order ON payments(order_id);
EOF
        success "Created 001_initial_schema.sql"
    fi
    
    # Check if other critical migrations exist, create placeholders if needed
    local required_migrations=(
        "002_product_variants.sql"
        "003_product_categories.sql"
        "004_user_accounts.sql"
    )
    
    for migration in "${required_migrations[@]}"; do
        if [ ! -f "migrations/$migration" ]; then
            warning "Migration $migration not found. Creating placeholder..."
            cat > "migrations/$migration" << EOF
-- Placeholder migration for $migration
-- This file should be populated with the actual migration content
SELECT 'Migration $migration executed successfully' as status;
EOF
        fi
    done
    
    success "Migration files check completed"
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    local max_wait=300
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        local postgres_healthy=$(docker-compose -f docker-compose.autonomous.yml ps -q postgres | grep healthy | wc -l)
        local redis_healthy=$(docker-compose -f docker-compose.autonomous.yml ps -q redis | grep healthy | wc -l)
        local backend_healthy=$(docker-compose -f docker-compose.autonomous.yml ps -q backend | grep healthy | wc -l)
        local frontend_healthy=$(docker-compose -f docker-compose.autonomous.yml ps -q frontend | grep healthy | wc -l)
        
        if [ "$postgres_healthy" -eq 1 ] && [ "$redis_healthy" -eq 1 ] && [ "$backend_healthy" -eq 1 ] && [ "$frontend_healthy" -eq 1 ]; then
            success "All services are healthy"
            return 0
        fi
        
        info "PostgreSQL: $postgres_healthy, Redis: $redis_healthy, Backend: $backend_healthy, Frontend: $frontend_healthy"
        sleep 10
        wait_time=$((wait_time + 10))
    done
    
    error_exit "Services failed to become healthy within $max_wait seconds" "Manual intervention may be required"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for PostgreSQL to be ready
    local max_wait=120
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if docker-compose -f docker-compose.autonomous.yml exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
            break
        fi
        info "Waiting for PostgreSQL to be ready... ($wait_time/$max_wait)"
        sleep 5
        wait_time=$((wait_time + 5))
    done
    
    if [ $wait_time -ge $max_wait ]; then
        error_exit "PostgreSQL not ready after $max_wait seconds"
    fi
    
    # Run migrations in order
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
        if [ -f "migrations/$migration_file" ]; then
            info "Running migration: $migration_file"
            docker-compose -f docker-compose.autonomous.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "/docker-entrypoint-initdb.d/$migration_file"
            if [ $? -eq 0 ]; then
                success "Migration $migration_file completed"
            else
                error_exit "Migration $migration_file failed" "Check migration file syntax and database connectivity"
            fi
        else
            warning "Migration file $migration_file not found, skipping"
        fi
    done
}

# Seed initial data
seed_data() {
    log "Seeding initial data..."
    
    # Wait for backend to be ready
    local max_wait=60
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if curl -s -f http://localhost:$BACKEND_PORT/api/health >/dev/null 2>&1; then
            break
        fi
        info "Waiting for backend to be ready for seeding... ($wait_time/$max_wait)"
        sleep 5
        wait_time=$((wait_time + 5))
    done
    
    if [ $wait_time -ge $max_wait ]; then
        error_exit "Backend not ready for seeding after $max_wait seconds"
    fi
    
    # Create admin user with proper error handling
    info "Creating admin user..."
    local admin_password_hash=$(docker-compose -f docker-compose.autonomous.yml exec -T backend node -e "
        const bcrypt = require('bcrypt');
        bcrypt.hash('$ADMIN_PASSWORD', 10).then(hash => console.log(hash)).catch(err => {
            console.error('Hashing failed:', err);
            process.exit(1);
        });
    " 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "$admin_password_hash" ]; then
        error_exit "Failed to generate admin password hash" "Check bcrypt availability in backend container"
    fi
    
    # Insert admin user
    local admin_result=$(docker-compose -f docker-compose.autonomous.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, created_at, updated_at) 
        VALUES ('admin-user', '$ADMIN_EMAIL', '$admin_password_hash', 'Admin', 'User', true, NOW(), NOW()) 
        ON CONFLICT (email) DO NOTHING;
        SELECT 'SUCCESS' as result;
    " 2>/dev/null | grep -o 'SUCCESS' || echo 'FAILED')
    
    if [ "$admin_result" = "SUCCESS" ]; then
        success "Admin user created successfully"
    else
        warning "Failed to create admin user or user already exists"
    fi
    
    # Create sales channels
    info "Creating sales channels..."
    local channels_result=$(docker-compose -f docker-compose.autonomous.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        INSERT INTO channels (id, name, api_key) VALUES 
        ('pwa-channel', 'PWA', 'pwa-api-key'),
        ('amazon-channel', 'AMAZON', 'amazon-api-key'),
        ('etsy-channel', 'ETSY', 'etsy-api-key')
        ON CONFLICT (name) DO NOTHING;
        SELECT 'SUCCESS' as result;
    " 2>/dev/null | grep -o 'SUCCESS' || echo 'FAILED')
    
    if [ "$channels_result" = "SUCCESS" ]; then
        success "Sales channels created successfully"
    else
        warning "Failed to create sales channels or channels already exist"
    fi
    
    # Create basic product categories if categories table exists
    info "Creating basic product categories..."
    local categories_result=$(docker-compose -f docker-compose.autonomous.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'categories'
        );
    " 2>/dev/null | grep -o 't' || echo 'f')
    
    if [ "$categories_result" = "t" ]; then
        docker-compose -f docker-compose.autonomous.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
            INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active, created_at, updated_at) VALUES
            ('bath-bombs', 'Bath Bombs', 'bath-bombs', 'Luxurious bath bombs for relaxation', NULL, 1, true, NOW(), NOW()),
            ('candles', 'Candles', 'candles', 'Scented candles for ambiance', NULL, 2, true, NOW(), NOW()),
            ('wax-melts', 'Wax Melts', 'wax-melts', 'Flameless fragrance options', NULL, 3, true, NOW(), NOW()),
            ('diffusers', 'Diffusers', 'diffusers', 'Home fragrance diffusers', NULL, 4, true, NOW(), NOW())
            ON CONFLICT (slug) DO NOTHING;
        " 2>/dev/null
        
        if [ $? -eq 0 ]; then
            success "Product categories created successfully"
        else
            warning "Failed to create product categories"
        fi
    else
        info "Categories table not found, skipping category creation"
    fi
    
    success "Initial data seeding completed"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check service health
    local postgres_healthy=$(docker-compose -f docker-compose.autonomous.yml ps -q postgres | grep healthy | wc -l)
    local redis_healthy=$(docker-compose -f docker-compose.autonomous.yml ps -q redis | grep healthy | wc -l)
    local backend_healthy=$(docker-compose -f docker-compose.autonomous.yml ps -q backend | grep healthy | wc -l)
    local frontend_healthy=$(docker-compose -f docker-compose.autonomous.yml ps -q frontend | grep healthy | wc -l)
    
    # Test API endpoints
    local api_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$BACKEND_PORT/api/health)
    local frontend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT)
    
    # Test database connectivity
    local db_connection=$(docker-compose -f docker-compose.autonomous.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" 2>/dev/null && echo "OK" || echo "FAILED")
    
    if [ "$postgres_healthy" -eq 1 ] && [ "$redis_healthy" -eq 1 ] && [ "$backend_healthy" -eq 1 ] && [ "$frontend_healthy" -eq 1 ] && [ "$api_health" = "200" ] && [ "$frontend_health" = "200" ] && [ "$db_connection" = "OK" ]; then
        success "Deployment verification passed"
        return 0
    else
        error_exit "Deployment verification failed" "PostgreSQL: $postgres_healthy, Redis: $redis_healthy, Backend: $backend_healthy, Frontend: $frontend_healthy, API: $api_health, DB: $db_connection"
    fi
}

# Display deployment summary
display_summary() {
    log "Deployment Summary"
    echo ""
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${GREEN}🎉 Wick Wax Relax Deployment Complete!${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo ""
    echo -e "${CYAN}📍 Access URLs:${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "   Backend API: ${GREEN}http://localhost:$BACKEND_PORT/api${NC}"
    echo -e "   Health Check: ${GREEN}http://localhost:$BACKEND_PORT/api/health${NC}"
    echo ""
    echo -e "${CYAN}🔐 Administrative Credentials:${NC}"
    echo -e "   Admin Email: ${YELLOW}$ADMIN_EMAIL${NC}"
    echo -e "   Admin Password: ${YELLOW}$ADMIN_PASSWORD${NC}"
    echo ""
    echo -e "${CYAN}🗄️ Database Credentials:${NC}"
    echo -e "   Database: ${YELLOW}$POSTGRES_DB${NC}"
    echo -e "   User: ${YELLOW}$POSTGRES_USER${NC}"
    echo -e "   Password: ${YELLOW}$POSTGRES_PASSWORD${NC}"
    echo -e "   Port: ${YELLOW}$POSTGRES_PORT${NC}"
    echo ""
    echo -e "${CYAN}🔑 Redis Credentials:${NC}"
    echo -e "   Password: ${YELLOW}$REDIS_PASSWORD${NC}"
    echo -e "   Port: ${YELLOW}$REDIS_PORT${NC}"
    echo ""
    echo -e "${CYAN}🔐 Application Secrets:${NC}"
    echo -e "   JWT Secret: ${YELLOW}$JWT_SECRET${NC}"
    echo -e "   JWT Refresh Secret: ${YELLOW}$JWT_REFRESH_SECRET${NC}"
    echo -e "   App Secret Key: ${YELLOW}$APP_SECRET_KEY${NC}"
    echo -e "   Encryption Key: ${YELLOW}$ENCRYPTION_KEY${NC}"
    echo ""
    echo -e "${CYAN}📊 System Resources:${NC}"
    echo -e "   CPU Cores: ${YELLOW}$CPU_CORES${NC}"
    echo -e "   Total Memory: ${YELLOW}$TOTAL_MEMORY${NC}"
    echo -e "   Available Disk: ${YELLOW}$AVAILABLE_DISK${NC}"
    echo -e "   Docker Version: ${YELLOW}$DOCKER_VERSION${NC}"
    echo ""
    echo -e "${CYAN}🐳 Docker Services:${NC}"
    docker-compose -f docker-compose.autonomous.yml ps
    echo ""
    echo -e "${GREEN}✅ All services are running and healthy!${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    # Save credentials to file
    cat > deployment-credentials.txt << EOF
# Wick Wax Relax Deployment Credentials
# Generated on: $(date)

## Access URLs
Frontend: http://localhost:$FRONTEND_PORT
Backend API: http://localhost:$BACKEND_PORT/api
Health Check: http://localhost:$BACKEND_PORT/api/health

## Administrative Credentials
Admin Email: $ADMIN_EMAIL
Admin Password: $ADMIN_PASSWORD

## Database Credentials
Database: $POSTGRES_DB
User: $POSTGRES_USER
Password: $POSTGRES_PASSWORD
Port: $POSTGRES_PORT

## Redis Credentials
Password: $REDIS_PASSWORD
Port: $REDIS_PORT

## Application Secrets
JWT Secret: $JWT_SECRET
JWT Refresh Secret: $JWT_REFRESH_SECRET
App Secret Key: $APP_SECRET_KEY
Encryption Key: $ENCRYPTION_KEY

## System Resources
CPU Cores: $CPU_CORES
Total Memory: $TOTAL_MEMORY
Available Disk: $AVAILABLE_DISK
Docker Version: $DOCKER_VERSION
EOF
    
    echo -e "${YELLOW}📝 Credentials saved to: deployment-credentials.txt${NC}"
    echo ""
    echo -e "${GREEN}🚀 Your Wick Wax Relax application is now ready!${NC}"
}

# Cleanup function
cleanup() {
    log "Cleaning up old containers and images..."
    
    # Remove orphaned containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting autonomous Docker deployment..."
    
    # Check if running as root (for system commands)
    if [ "$EUID" -ne 0 ]; then
        log "Running as non-root user, some system commands may require sudo"
    fi
    
    # Check if Docker is installed and running
    if ! command -v docker >/dev/null 2>&1; then
        error_exit "Docker is not installed" "Please install Docker before running this script"
    fi
    
    if ! docker info >/dev/null 2>&1; then
        error_exit "Docker daemon is not running" "Please start Docker service"
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        error_exit "Docker Compose is not installed" "Please install Docker Compose before running this script"
    fi
    
    # Check system compatibility
    if ! command -v uname >/dev/null 2>&1; then
        error_exit "System compatibility check failed" "Unable to determine system information"
    fi
    
    if ! command -v nproc >/dev/null 2>&1; then
        error_exit "System compatibility check failed" "Unable to determine CPU cores"
    fi
    
    if ! command -v free >/dev/null 2>&1; then
        error_exit "System compatibility check failed" "Unable to determine memory information"
    fi
    
    if ! command -v df >/dev/null 2>&1; then
        error_exit "System compatibility check failed" "Unable to determine disk information"
    fi
    
    # Run deployment steps
    detect_environment
    allocate_ports
    generate_credentials
    create_missing_migrations
    create_docker_compose
    create_nginx_config
    create_backend_dockerfile
    create_frontend_dockerfile
    
    # Build and start services
    log "Building and starting Docker services..."
    docker-compose -f docker-compose.autonomous.yml down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.autonomous.yml build --no-cache
    docker-compose -f docker-compose.autonomous.yml up -d
    
    # Wait for services and run migrations
    wait_for_services
    run_migrations
    seed_data
    
    # Verify deployment
    verify_deployment
    
    # Display summary
    display_summary
    
    success "Autonomous Docker deployment completed successfully!"
}

# Handle script interruption
trap cleanup_on_error EXIT
trap cleanup_on_error INT

# Check for cleanup flag
if [ "${1:-}" = "--cleanup" ]; then
    cleanup
    exit 0
fi

# Check for help flag
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --cleanup    Clean up old containers and images"
    echo "  --help       Show this help message"
    echo ""
    echo "This script performs autonomous Docker deployment with:"
    echo "  - Environment detection and port allocation"
    echo "  - Secure credential generation"
    echo "  - Multi-container service orchestration"
    echo "  - Automatic migration file creation"
    echo "  - Database migration and seeding"
    echo "  - Health checks and monitoring"
    echo "  - Complete deployment verification"
    echo "  - Production-ready security configuration"
    exit 0
fi

# Run main function
main "$@"