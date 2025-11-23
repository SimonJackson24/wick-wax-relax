# Hierarchical Categories Deployment Guide

This guide provides instructions for deploying the Wick Wax Relax application with the new hierarchical category structure to a new environment.

## Database Migration Requirement

Yes, you will need to run the database migration every time you install this application in a new environment. The migration creates the necessary tables, views, and functions for the hierarchical category structure.

## Deployment Steps

### Step 1: Set Up the Database

1. Create a new PostgreSQL database for the application:
   ```sql
   CREATE DATABASE wick_wax_relax;
   ```

2. Create a database user with appropriate permissions:
   ```sql
   CREATE USER wick_wax_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE wick_wax_relax TO wick_wax_user;
   ```

### Step 2: Run Database Migrations

Run all migration scripts in order to set up the database schema:

#### Option 1: Run All Migrations
```bash
# Navigate to the migrations directory
cd migrations

# Run all migration files in order
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 001_initial_schema.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 002_product_variants.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 003_product_categories.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 004_user_accounts.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 005_order_items.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 006_inventory_audit_log.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 007_add_product_images.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 007_add_refresh_token.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 008_add_tracking_fields.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 009_security_audit_log.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 009_suppliers.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 010_gdpr_consent_tracking.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 010_platform_settings.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 011_performance_indexes.sql
psql -h localhost -U wick_wax_user -d wick_wax_relax -f 012_hierarchical_categories.sql
```

#### Option 2: Use the Migration Script (Recommended)
```bash
# For Unix/Linux/macOS
./migrate-database.sh

# For Windows
migrate-database.bat
```

### Step 3: Configure Environment Variables

Create a `.env` file in the backend directory with the following environment variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wick_wax_relax
DB_USER=wick_wax_user
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Server Configuration
PORT=3001
NODE_ENV=production
```

### Step 4: Install Dependencies

Install dependencies for both the backend and frontend:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 5: Build the Frontend

Build the frontend for production:

```bash
cd frontend
npm run build
```

### Step 6: Set Up the Admin Account

Run the setup script to create the initial admin account:

```bash
cd backend
node setup-admin.js
```

### Step 7: Start the Application

Start the backend server:

```bash
cd backend
npm start
```

If you're using a process manager like PM2:

```bash
pm2 start server.js --name "wick-wax-relax-api"
```

### Step 8: Configure Web Server (Optional)

If you're using a web server like Nginx or Apache, configure it to serve the frontend and proxy API requests to the backend.

#### Example Nginx Configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/out;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Initial Setup Tasks

After deploying the application, you'll need to perform these initial setup tasks:

1. ** migrate existing categories to the new hierarchy**
   - Log in to the admin interface
   - Navigate to Categories
   - Click "Migrate Existing Categories"
   - Review and adjust the category structure as needed

2. **Add initial products**
   - Add your products to the system
   - Assign them to appropriate categories

3. **Configure site settings**
   - Update site information
   - Configure payment and shipping options

## CloudPanel Deployment

Use `deploy-production.sh` to perform an end-to-end CloudPanel deployment with Docker Compose. The script now generates the CloudPanel environment file if it does not exist and blocks deployment until you set a real domain.

```bash
# 1) Run the deployment script (first run will create /etc/wick-wax-relax/cloudpanel.env)
./deploy-production.sh

# 2) Edit the generated env file to set your real DOMAIN, DB credentials, and secrets
sudo nano /etc/wick-wax-relax/cloudpanel.env

# 3) Re-run deployment after updating the env file
./deploy-production.sh
```

What the script does:

1. Generates `/etc/wick-wax-relax/cloudpanel.env` from `cloudpanel.env.example` with secure random secrets when the file is missing.
2. Validates that required variables are present and that `DOMAIN` is not the placeholder value before continuing.
3. Builds and starts the Docker Compose stack defined in `docker-compose.cloudpanel.yml` using the env file.
4. Waits for the backend health check to pass, runs migrations, seeds the admin user and products, and reloads Nginx.
5. Prints URLs and log locations at the end of the run.

## Automated Deployment

For automated deployment pipelines (outside CloudPanel), you can include the migration steps in your deployment script:

```bash
#!/bin/bash
# Deploy script example

# Pull latest code
git pull origin main

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run database migrations
cd .. && ./migrate-database.sh

# Build frontend
cd frontend && npm run build

# Restart application
pm2 restart wick-wax-relax-api
```

```dockerfile
# Backend Dockerfile example
FROM node:16

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Run database migrations
RUN npm run migrate

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

## Troubleshooting

### Migration Fails
- Check database connection parameters
- Ensure the database user has sufficient permissions
- Verify that previous migrations have been run in order

### Categories Not Showing
- Ensure the migration has been run successfully
- Check that categories are marked as active in the database
- Verify the API endpoints are accessible

### Products Not Appearing
- Run the migration tool to associate existing products with new categories
- Check product-category relationships in the database

## Conclusion

The database migration is a required step for every new installation of the application. It sets up the necessary database structure for the hierarchical category system and ensures that all features work correctly.

By following this deployment guide, you can successfully install the Wick Wax Relax application with the new hierarchical category structure in any environment.