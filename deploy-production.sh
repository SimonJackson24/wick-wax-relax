#!/usr/bin/env bash
set -e

# Validate environment file exists
ENV_FILE="/etc/wick-wax-relax/cloudpanel.env"
if [ ! -f "${ENV_FILE}" ]; then
    echo "ERROR: Missing cloudpanel.env file at ${ENV_FILE}"
    echo "Create from cloudpanel.env.example and populate with valid credentials"
    exit 1
fi
source "${ENV_FILE}"

# Validate required environment variables
required_vars=(DOMAIN DB_NAME DB_USER DB_PASSWORD JWT_SECRET JWT_REFRESH_SECRET)
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERROR: Missing required environment variable: ${var}"
        exit 1
    fi
done

echo "🚀 Deploying Wick Wax Relax to CloudPanel"
echo "=========================================="

# Verify Docker permissions
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker permissions required. Run:"
    echo "  sudo usermod -aG docker \$USER && newgrp docker"
    exit 1
fi

# Create CloudPanel directory structure with correct permissions
mkdir -p "/srv/cloudpanel/htdocs/${DOMAIN}/public/{frontend,backend}"
chown -R www-data:www-data "/srv/cloudpanel/htdocs/${DOMAIN}"
chmod -R 775 "/srv/cloudpanel/htdocs/${DOMAIN}"

# Build and start containers with isolated network
# Build and deploy with explicit env file
docker-compose --env-file "${ENV_FILE}" \
  -f docker-compose.cloudpanel.yml build
docker-compose --env-file "${ENV_FILE}" \
  -f docker-compose.cloudpanel.yml up -d --force-recreate

# Wait for backend health check with timeout
echo "Waiting for backend initialization..."
timeout 300 bash -c 'while ! docker-compose -f docker-compose.cloudpanel.yml exec -T backend curl -s http://localhost:3001/api/health >/dev/null; do sleep 5; done'

# Run database migrations with rollback support
echo "Running database migrations..."
docker-compose -f docker-compose.cloudpanel.yml exec -T backend \
    sh -c 'cd migrations && ./migrate-database.sh --production'

# Seed the database
echo "Seeding database with admin user..."
docker-compose -f docker-compose.cloudpanel.yml exec -T backend node setup-admin.js
echo "Seeding database with products..."
docker-compose -f docker-compose.cloudpanel.yml exec -T backend node seed-products.js

# Zero-downtime Nginx reload
docker-compose -f docker-compose.cloudpanel.yml exec -T nginx nginx -s reload

echo "🎉 Deployment complete!"
echo "Frontend: https://${DOMAIN}"
echo "Backend API: https://${DOMAIN}/api"
echo "Logs: /var/log/cloudpanel/${DOMAIN}"