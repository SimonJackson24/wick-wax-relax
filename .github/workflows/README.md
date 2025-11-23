### 1. Server Prerequisites

Your Cloudpanel VPS needs:
- ✅ **SSH access** (for GitHub Actions)
- ✅ **sudo privileges** (for PostgreSQL installation - SSH user must be in sudo group)
- ✅ **Git repository** cloned to `/home/wickwaxrelax/htdocs/www.wickwaxrelax.co.uk`

### SSH User Setup
```bash
# On your server, ensure SSH user has sudo access
sudo usermod -aG sudo wickwaxrelax

# Or if using a different user:
sudo usermod -aG sudo your-ssh-username
```

### 2. GitHub Secrets (Only These Required)

```
SSH_HOST          # Your VPS IP address or domain
SSH_USER          # SSH username with sudo privileges
SSH_KEY           # Private SSH key for authentication
DB_PASSWORD       # PostgreSQL password (secure random string)
JWT_SECRET        # JWT signing secret (secure random string)
JWT_REFRESH_SECRET # JWT refresh token secret (secure random string)
```

### 3. SSH Key Setup

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@wickwaxrelax.co.uk" -f github_actions_key

# Copy public key to server
ssh-copy-id -i github_actions_key.pub wickwaxrelax@your-server-ip

# Add to GitHub secrets:
# SSH_KEY = contents of github_actions_key (private key file)
# SSH_USER = wickwaxrelax (or your SSH username)
# SSH_HOST = your-server-ip