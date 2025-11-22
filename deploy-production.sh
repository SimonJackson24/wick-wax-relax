#!/bin/bash
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

# Create CloudPanel directory structure with correct permissions
sudo mkdir -p /srv/cloudpanel/htdocs/${DOMAIN}/public/{frontend,backend}
sudo chown -R 1000:1000 /srv/cloudpanel/htdocs/${DOMAIN}

# Build and start containers with isolated network
docker-compose -f docker-compose.cloudpanel.yml build
docker-compose -f docker-compose.cloudpanel.yml up -d --force-recreate

# Wait for backend health check with timeout
echo "Waiting for backend initialization..."
timeout 300 bash -c 'while ! docker-compose -f docker-compose.cloudpanel.yml exec -T backend curl -s http://localhost:3001/api/health >/dev/null; do sleep 5; done'

# Run database migrations with rollback support
echo "Running database migrations..."
docker-compose -f docker-compose.cloudpanel.yml exec -T backend \
    sh -c 'cd migrations && ./migrate-database.sh --production'

# Zero-downtime Nginx reload
docker-compose -f docker-compose.cloudpanel.yml exec -T nginx nginx -s reload

echo "🎉 Deployment complete!"
echo "Frontend: https://${DOMAIN}"
echo "Backend API: https://${DOMAIN}/api"
echo "Logs: /srv/cloudpanel/logs"