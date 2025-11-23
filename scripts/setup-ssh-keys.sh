#!/bin/bash

# SSH Key Generation Script for GitHub Actions CI/CD
# This script generates SSH keys for secure deployment

echo "🔐 GitHub Actions SSH Key Setup for Wick Wax Relax"
echo "=================================================="

# Check if keys already exist
if [ -f "github_actions_key" ] || [ -f "github_actions_key.pub" ]; then
    echo "⚠️  SSH keys already exist in this directory!"
    echo "   To generate new keys, please backup and remove existing keys first."
    exit 1
fi

# Generate SSH key pair
echo "Generating SSH key pair..."
ssh-keygen -t rsa -b 4096 -C "github-actions@wick-wax-relax" -f github_actions_key -N ""

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSH key pair generated successfully!"
    echo ""
    echo "📋 Next steps:"
    echo ""
    echo "1. Copy the PUBLIC key to your server's ~/.ssh/authorized_keys:"
    echo "   cat github_actions_key.pub"
    echo "   (Then paste the output on your server)"
    echo ""
    echo "2. Add these secrets to your GitHub repository:"
    echo "   - SSH_HOST: Your VPS IP address or domain"
    echo "   - SSH_USER: SSH username (usually 'root' or your user)"
    echo "   - SSH_KEY: (Copy the entire private key below)"
    echo ""
    echo "   Private key (copy everything between the === markers):"
    echo "   ======================================================="
    cat github_actions_key
    echo "   ======================================================="
    echo ""
    echo "3. Secure the private key file:"
    chmod 600 github_actions_key
    echo "   ✅ Private key permissions set to 600"
    echo ""
    echo "4. Keep the private key secure and never commit it to version control!"
    echo ""
    echo "⚠️  IMPORTANT SECURITY NOTES:"
    echo "   - Never commit the private key (github_actions_key) to git"
    echo "   - The public key (github_actions_key.pub) can be safely shared"
    echo "   - Regularly rotate these keys for security"
    echo ""
else
    echo "❌ Failed to generate SSH keys"
    exit 1
fi