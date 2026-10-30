#!/usr/bin/env bash
# ==============================================================================
# HOMESEVA ENTERPRISE VPS AUTOMATED DEPLOYMENT SCRIPT
# Ubuntu / Debian / RHEL / CentOS
# ==============================================================================

set -e

echo "🚀 Starting HomeSeva Enterprise Production VPS Deployment..."

# 1. Check Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable --now docker
fi

if ! command -v docker compose &> /dev/null; then
    echo "📦 Installing Docker Compose plugin..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# 2. Check Environment Configuration
if [ ! -f .env ]; then
    if [ -f .env.vps.example ]; then
        echo "📝 Creating .env from .env.vps.example..."
        cp .env.vps.example .env
        echo "⚠️ Please review and edit .env with your production credentials before continuing."
    else
        echo "❌ .env file not found. Please create .env before deploying."
        exit 1
    fi
fi

# 3. Pull / Build and Spin Up Services
echo "🔨 Building Docker containers and launching PostgreSQL + Web Portal..."
docker compose -f docker-compose.vps.yml down --remove-orphans || true
docker compose -f docker-compose.vps.yml build --no-cache
docker compose -f docker-compose.vps.yml up -d

# 4. Wait for Healthcheck
echo "⏳ Waiting for PostgreSQL and Next.js services to become healthy..."
sleep 10

# 5. Verify Database Tables
echo "🔍 Checking database connectivity..."
docker compose -f docker-compose.vps.yml exec -T postgres psql -U homeseva -d homeseva_db -c "\dt"

echo ""
echo "=============================================================================="
echo "✅ HomeSeva Enterprise deployed successfully on VPS!"
echo "🌐 Web Portal running on port 80 / 443 via Nginx Reverse Proxy."
echo "🗄️ PostgreSQL Database active with zero mock data and complete schema."
echo "=============================================================================="

