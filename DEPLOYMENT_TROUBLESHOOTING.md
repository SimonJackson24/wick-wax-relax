# Deployment Troubleshooting Guide

This guide helps troubleshoot common deployment issues with the Wick Wax Relax application.

## Database Authentication Issues

### Error: `password authentication failed for user "wick_wax_user"`

This error occurs when PostgreSQL cannot authenticate the database user during deployment.

#### Causes and Solutions

1. **User Creation Failed**
   - **Symptom**: User doesn't exist in PostgreSQL
   - **Solution**: Check the deployment logs for user creation errors
   - **Manual Fix**:
     ```bash
     sudo -u postgres psql -c "CREATE USER wick_wax_user WITH PASSWORD 'your_password' LOGIN;"
     ```

2. **Incorrect Password**
   - **Symptom**: Authentication fails with existing user
   - **Solution**: Verify the `DB_PASSWORD` secret in GitHub Actions
   - **Manual Fix**:
     ```bash
     sudo -u postgres psql -c "ALTER USER wick_wax_user WITH PASSWORD 'correct_password';"
     ```

3. **Missing Database Privileges**
   - **Symptom**: User exists but cannot access the database
   - **Solution**: Ensure proper privileges are granted
   - **Manual Fix**:
     ```bash
     sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE wick_wax_relax TO wick_wax_user;"
     sudo -u postgres psql -d wick_wax_relax -c "GRANT ALL ON SCHEMA public TO wick_wax_user;"
     sudo -u postgres psql -d wick_wax_relax -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wick_wax_user;"
     ```

4. **PostgreSQL Service Issues**
   - **Symptom**: Connection refused or service not running
   - **Solution**: Check PostgreSQL service status
   - **Manual Fix**:
     ```bash
     sudo systemctl status postgresql
     sudo systemctl start postgresql
     sudo systemctl enable postgresql
     ```

### Debugging Steps

1. **Check PostgreSQL Status**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Verify User Exists**
   ```bash
   sudo -u postgres psql -c "\du" | grep wick_wax_user
   ```

3. **Verify Database Exists**
   ```bash
   sudo -u postgres psql -c "\l" | grep wick_wax_relax
   ```

4. **Test Connection Manually**
   ```bash
   PGPASSWORD="your_password" psql -h localhost -U wick_wax_user -d wick_wax_relax -c "SELECT 1;"
   ```

5. **Check PostgreSQL Logs**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-*-main.log
   ```

## Common Deployment Issues

### 1. Node.js Version Mismatch
- **Solution**: Ensure Node.js 18+ is installed on the server
- **Check**: `node --version`

### 2. Missing Dependencies
- **Solution**: Run `npm install` in both backend and frontend directories
- **Check**: Verify `package-lock.json` files are present

### 3. PM2 Process Issues
- **Solution**: Restart PM2 processes
- **Commands**:
  ```bash
  pm2 stop wick-wax-relax-api
  pm2 delete wick-wax-relax-api
  pm2 start server.js --name wick-wax-relax-api --env-file .env
  ```

### 4. Nginx Configuration Issues
- **Solution**: Check Nginx configuration and restart
- **Commands**:
  ```bash
  sudo nginx -t
  sudo systemctl restart nginx
  ```

## Environment Variables

Required environment variables for deployment:

```bash
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wick_wax_relax
DB_USER=wick_wax_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## Health Checks

### Manual Health Check
```bash
curl -f http://localhost:3001/api/health
```

### Check PM2 Status
```bash
pm2 status
pm2 logs wick-wax-relax-api
```

### Check Application Logs
```bash
pm2 logs wick-wax-relax-api --lines 50
```

## Emergency Recovery

If deployment fails completely:

1. **Rollback to Previous Version**
   ```bash
   git checkout previous_commit_hash
   # Redeploy
   ```

2. **Manual Database Reset**
   ```bash
   cd backend
   npm run db:reset
   npm run db:init
   ```

3. **Restart Services**
   ```bash
   sudo systemctl restart postgresql
   pm2 restart all
   sudo systemctl restart nginx
   ```

## Monitoring

Set up monitoring for:
- PostgreSQL service status
- PM2 process status
- Nginx status
- Disk space usage
- Memory usage

## Contact Support

If issues persist:
1. Check GitHub Actions deployment logs
2. Review server logs in `/var/log/`
3. Verify all secrets are correctly configured in GitHub Actions
4. Ensure server has sufficient resources (CPU, RAM, disk space)