### Deployment Options

This project supports two deployment methods:

### Option 1: GitHub Actions CI/CD (Recommended)

#### 1. Server Prerequisites

Your Cloudpanel VPS needs:
- ✅ **SSH access** (for GitHub Actions)
- ✅ **sudo privileges** (for PostgreSQL installation - SSH user must be in sudo group)
- ✅ **Git repository** cloned to `/home/wickwaxrelax/htdocs/www.wickwaxrelax.co.uk`

#### SSH User Setup
```bash
# On your server, ensure SSH user has sudo access
sudo usermod -aG sudo wickwaxrelax

# Or if using a different user:
sudo usermod -aG sudo your-ssh-username
```

#### 2. GitHub Secrets (Only These Required)

```
SSH_HOST          # Your VPS IP address or domain
SSH_USER          # SSH username with sudo privileges
SSH_KEY           # Private SSH key for authentication
DB_PASSWORD       # PostgreSQL password (secure random string)
JWT_SECRET        # JWT signing secret (secure random string)
JWT_REFRESH_SECRET # JWT refresh token secret (secure random string)
```

#### 3. SSH Key Setup

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@wickwaxrelax.co.uk" -f github_actions_key

# Copy public key to server
ssh-copy-id -i github_actions_key.pub wickwaxrelax@your-server-ip

# Add to GitHub secrets:
# SSH_KEY = contents of github_actions_key (private key file)
# SSH_USER = wickwaxrelax (or your SSH username)
# SSH_HOST = your-server-ip
```

### Option 2: Manual Server-Side Deployment

You can also deploy directly on your server using the `deploy-production.sh` script:

1. **SSH into your server:**
   ```bash
   ssh your-username@your-server-ip
   ```

2. **Navigate to your project directory:**
   ```bash
   cd /home/wickwaxrelax/htdocs/www.wickwaxrelax.co.uk
   ```

3. **Make the script executable and run it:**
   ```bash
   chmod +x deploy-production.sh
   ./deploy-production.sh
   ```

The script will automatically handle PostgreSQL installation, database setup, dependency installation, and application deployment.

**Note:** Both deployment methods produce the same result - a fully functional Wick Wax Relax application with secure credentials and admin access.