# Wick Wax Relax Deployment Scripts

This directory contains deployment scripts designed to handle PostgreSQL authentication issues and provide reliable deployment for the Wick Wax Relax application.

## Scripts

### deploy-robust.sh
A comprehensive deployment script that handles multiple authentication methods, timing delays, and graceful error recovery for traditional server deployment.

**Features:**
- Multiple authentication methods (environment variables, .pgpass file)
- Timing delays for PostgreSQL startup
- Retry mechanisms with exponential backoff
- Comprehensive error handling with colored output
- Graceful failure recovery
- Robust migration system with fallbacks
- Data seeding with bcrypt hashing
- Dependency management and application lifecycle

**Usage:**
```bash
# Set the database password
export DB_PASSWORD="your_secure_password_here"

# Run the deployment
./scripts/deploy-robust.sh
```

### deploy-docker-autonomous.sh
A comprehensive Docker deployment script that performs complete environment assessment, autonomous service orchestration, and credential management.

**Features:**
- Complete environment detection (CPU, memory, disk, Docker version)
- Dynamic port allocation for frontend (3000-3099), backend (8000-8099), database (5432-5499)
- Multi-container Docker environment with nginx reverse proxy
- Cryptographically secure random password generation
- Automatic service health checks and monitoring
- Comprehensive error handling with timestamps
- Resource monitoring and verification
- Idempotent deployment with cleanup mechanisms
- Complete deployment summary with access URLs and credentials

**Services:**
- PostgreSQL Database with persistent volumes
- Redis Cache for performance
- Node.js/Express Backend API
- React Frontend with Next.js
- Nginx Reverse Proxy with SSL support

**Usage:**
```bash
# Run the autonomous Docker deployment
./scripts/deploy-docker-autonomous.sh

# Clean up old containers and images
./scripts/deploy-docker-autonomous.sh --cleanup

# Show help
./scripts/deploy-docker-autonomous.sh --help
```

**Security Features:**
- All credentials generated cryptographically using OpenSSL
- Secure random passwords for all services
- JWT secret keys with 64-character entropy
- Database authentication with SCRAM-SHA-256
- SSL/TLS configuration for HTTPS
- Rate limiting and security headers

**Monitoring:**
- Health checks for all services
- Automatic restart policies
- Resource usage tracking
- Service dependency verification
- HTTP endpoint testing
- Database connectivity validation

## Security Note

Both scripts use secure defaults and require explicit password setting via environment variable for security reasons. Never hardcode passwords in scripts.

## Integration

These scripts are designed to work with existing GitHub Actions workflows but provide better error handling and recovery mechanisms when authentication timing issues occur.

## Docker Requirements

- Docker Engine 20.10+ and Docker Compose v2.0+
- Minimum 2 CPU cores, 4GB RAM, 20GB disk space
- Linux/macOS/Windows with Docker support

## Port Allocation

The Docker script automatically detects and allocates unused ports:
- Frontend: 3000-3099 range
- Backend API: 8000-8099 range
- PostgreSQL: 5432 (default) or 5433-5499 if occupied
- Redis: 6379 (default) or 6380-6399 if occupied