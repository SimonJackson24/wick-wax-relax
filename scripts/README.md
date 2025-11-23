# Robust PostgreSQL Deployment Script

This directory contains deployment scripts designed to handle PostgreSQL authentication issues and provide reliable deployment for the Wick Wax Relax application.

## Scripts

### deploy-robust.sh
A comprehensive deployment script that handles multiple authentication methods, timing delays, and graceful error recovery.

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

## Security Note

The script uses secure defaults and requires explicit password setting via environment variable for security reasons. Never hardcode passwords in scripts.

## Integration

This script is designed to work with the existing GitHub Actions workflow but provides better error handling and recovery mechanisms when authentication timing issues occur.