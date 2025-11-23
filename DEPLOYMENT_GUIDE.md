## CloudPanel Deployment

**Two Deployment Options Available:**

### Option 1: Fully Automated GitHub Actions Deployment (Recommended)

**Prerequisites**
- ✅ SSH access to your Cloudpanel VPS
- ✅ SSH user with `sudo` privileges
- ✅ Git repository cloned on server
- ✅ GitHub repository with Actions enabled
- ✅ GitHub secrets configured (SSH keys, DB password, JWT secrets)

**Automated Deployment Process**

1. **PostgreSQL Installation** (automatic)
   - Detects if PostgreSQL is installed
   - Installs and configures if missing
   - Creates database and user automatically

2. **Schema Initialization** (automatic)
   - Runs `npm run db:init` to create all tables
   - Seeds initial admin user and data

3. **Application Deployment** (automatic)
   - Builds frontend, configures environment
   - Starts with PM2, runs health checks

4. **Success Confirmation** (automatic)
   - Provides admin login credentials
   - Shows frontend and API URLs

**Setup Steps**

1. **Configure GitHub Secrets:**
   ```
   SSH_HOST          # Your VPS IP/domain
   SSH_USER          # SSH user with sudo access
   SSH_KEY           # Private SSH key
   DB_PASSWORD       # Secure database password
   JWT_SECRET        # JWT signing secret
   JWT_REFRESH_SECRET # JWT refresh secret
   ```

2. **Deploy:**
   ```bash
   # Just push to master branch!
   git push origin master

   # GitHub Actions automatically:
   # - Installs PostgreSQL
   # - Sets up database
   # - Deploys application
   # - Provides login credentials
   ```

### Option 2: One-Command Server-Side Deployment (Manual)

**Prerequisites**
- ✅ SSH access to your Cloudpanel VPS
- ✅ SSH user with `sudo` privileges (must be in sudo group)
- ✅ Git repository cloned on server
- ✅ Project files accessible on the server

**One-Command Deployment Process**

1. **Connect to your server via SSH:**
   ```bash
   ssh your-username@your-server-ip
   ```

2. **Navigate to your project directory:**
   ```bash
   cd /home/wickwaxrelax/htdocs/www.wickwaxrelax.co.uk
   ```

3. **Run the deployment script:**
   ```bash
   ./deploy-production.sh
   ```

**What the script does automatically:**
- ✅ Installs PostgreSQL if not present
- ✅ Creates secure database credentials
- ✅ Sets up database schema and initial data
- ✅ Installs all dependencies (frontend and backend)
- ✅ Builds the frontend for production
- ✅ Configures environment variables securely
- ✅ Starts the application with PM2
- ✅ Runs health checks and provides credentials

### What You Get

**After successful deployment (both methods):**
```
✅ Deployment successful!
🌐 Frontend: https://www.wickwaxrelax.co.uk
🔗 Backend API: https://www.wickwaxrelax.co.uk/api

🔐 Admin Login Credentials:
   Email: admin@wickwaxrelax.co.uk
   Password: admin123

⚠️  IMPORTANT: Change the default admin password immediately!
```

### Troubleshooting

- **PostgreSQL Issues**: Check if SSH user has sudo privileges
- **Permission Errors**: Ensure SSH user can run `sudo apt install`
- **Connection Issues**: Verify SSH key and host settings
- **Deployment Logs**:
  - GitHub Actions: Check GitHub Actions logs
  - Manual deployment: Check terminal output and PM2 logs (`pm2 logs wick-wax-relax-api`)
- **Script Permissions**: If you get "Permission denied" error, run `chmod +x deploy-production.sh` first