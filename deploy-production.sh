#!/usr/bin/env bash
set -e

echo "⚠️  DEPRECATED: This script is for Docker-based deployment."
echo "   For fully automated deployment, use GitHub Actions CI/CD instead."
echo ""
echo "To deploy automatically:"
echo "1. Configure GitHub secrets (SSH_HOST, SSH_USER, SSH_KEY, DB_PASSWORD, JWT secrets)"
echo "2. Push to master branch: git push origin master"
echo "3. GitHub Actions will handle PostgreSQL installation and deployment automatically"
echo ""
echo "For manual deployment, see .github/workflows/README.md"

exit 1
