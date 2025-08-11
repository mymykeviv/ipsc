#!/bin/bash

# CASHFLOW Deployment Script
# Version: 1.0.0
# Build Date: 2024-01-15

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version information
VERSION="1.0.0"
BUILD_DATE=$(date +"%Y-%m-%d %H:%M:%S")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  IPSC Deployment v${VERSION}${NC}"
echo -e "${BLUE}  Build: ${BUILD_DATE}${NC}"
echo -e "${BLUE}  Commit: ${GIT_COMMIT}${NC}"
echo -e "${BLUE}================================${NC}"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
fi

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    error "Docker Compose is not installed or not in PATH."
fi

# Create build info file
log "Creating build information..."
cat > build-info.json << EOF
{
  "version": "${VERSION}",
  "build_date": "${BUILD_DATE}",
  "git_commit": "${GIT_COMMIT}",
  "deployment_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "services": {
    "backend": "FastAPI v1.0.0",
    "frontend": "React v1.0.0",
    "database": "PostgreSQL 16",
    "mailhog": "MailHog v1.0.1"
  }
}
EOF

# Stop existing containers
log "Stopping existing containers..."
docker compose down --remove-orphans

# Remove old images to ensure fresh build
log "Removing old images..."
docker compose down --rmi all --volumes --remove-orphans 2>/dev/null || true

# Build and start services
log "Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 10

# Check service health
log "Checking service health..."

# Check backend health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    log "✅ Backend is healthy"
    BACKEND_VERSION=$(curl -s http://localhost:8000/version | jq -r '.version' 2>/dev/null || echo "unknown")
    log "   Backend version: ${BACKEND_VERSION}"
else
    error "❌ Backend health check failed"
fi

# Check frontend
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    log "✅ Frontend is accessible"
else
    warn "⚠️  Frontend health check failed (may still be starting)"
fi

# Check database
if docker compose exec -T db pg_isready -U ipsc > /dev/null 2>&1; then
    log "✅ Database is ready"
else
    error "❌ Database health check failed"
fi

# Check mailhog
if curl -f http://localhost:8025 > /dev/null 2>&1; then
    log "✅ MailHog is accessible"
else
    warn "⚠️  MailHog health check failed"
fi

# Display deployment summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Deployment Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  MailHog: ${GREEN}http://localhost:8025${NC}"
echo ""
echo -e "${BLUE}Default Login:${NC}"
echo -e "  Username: ${GREEN}admin${NC}"
echo -e "  Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}Version Information:${NC}"
echo -e "  Application: ${GREEN}v${VERSION}${NC}"
echo -e "  Build Date: ${GREEN}${BUILD_DATE}${NC}"
echo -e "  Git Commit: ${GREEN}${GIT_COMMIT}${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  View logs: ${GREEN}docker compose logs -f${NC}"
echo -e "  Stop services: ${GREEN}docker compose down${NC}"
echo -e "  Restart services: ${GREEN}docker compose restart${NC}"
echo -e "${BLUE}================================${NC}"
