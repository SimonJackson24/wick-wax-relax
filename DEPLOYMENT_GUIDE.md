## CloudPanel Deployment

**Fully Automated Deployment** - PostgreSQL installation and configuration is now completely automated!

### Prerequisites
- ✅ SSH access to your Cloudpanel VPS
- ✅ SSH user with `sudo` privileges
- ✅ Git repository cloned on server
- ✅ GitHub repository with Actions enabled
- ✅ GitHub secrets configured (SSH keys, DB password, JWT secrets)

### Automated Deployment Process

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

### Setup Steps

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

### What You Get

**After successful deployment:**
```
✅ Deployment successful!
🌐 Frontend: https://your-domain.com
🔗 Backend API: https://your-domain.com/api

🔐 Admin Login Credentials:
   Email: admin@wickwaxrelax.co.uk
   Password: admin123

⚠️  IMPORTANT: Change the default admin password immediately!
```

### Troubleshooting

- **PostgreSQL Issues**: Check if SSH user has sudo privileges
- **Permission Errors**: Ensure SSH user can run `sudo apt install`
- **Connection Issues**: Verify SSH key and host settings
- **Deployment Logs**: Check GitHub Actions logs for detailed errors