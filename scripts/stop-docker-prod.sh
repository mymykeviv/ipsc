#!/bin/bash

# Stop Docker Production Environment Script

set -e

echo "🛑 Stopping Docker Production Environment"
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

# Create backup before stopping
print_status "Creating database backup before stopping..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_file="backup_${timestamp}.sql"

if docker ps -q -f name=cashflow-db-prod | grep -q .; then
    docker exec cashflow-db-prod pg_dump -U postgres cashflow > "backups/${backup_file}"
    print_success "Database backup created: backups/${backup_file}"
else
    print_warning "Production database container not found"
fi

# Stop Docker containers
print_status "Stopping Docker containers..."
docker-compose -f docker-compose.prod.yml down

print_success "Docker production environment stopped successfully!"
echo ""
echo "📝 All services have been stopped:"
echo "   - Frontend (port 80)"
echo "   - Backend (port 8000)"
echo "   - PostgreSQL (port 5432)"
echo ""
echo "💾 Database backup saved to: backups/${backup_file}"
echo ""
echo "🚀 To start again, run: ./scripts/docker-prod.sh"
