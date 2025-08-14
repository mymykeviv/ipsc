#!/bin/bash

# Stop Docker Development Environment Script

set -e

echo "🛑 Stopping Docker Development Environment"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop Docker containers
print_status "Stopping Docker containers..."
docker-compose -f docker-compose.dev.yml down

print_success "Docker development environment stopped successfully!"
echo ""
echo "📝 All services have been stopped:"
echo "   - Frontend (port 5173)"
echo "   - Backend (port 8000)"
echo "   - MailHog (port 8025)"
echo "   - PostgreSQL (port 5432)"
echo ""
echo "🚀 To start again, run: ./scripts/docker-dev.sh"
