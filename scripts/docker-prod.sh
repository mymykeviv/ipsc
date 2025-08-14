#!/bin/bash

# Docker Production Deployment Script
# This script deploys the application using Docker for production

set -e

echo "🚀 Starting Docker Production Environment"
echo "========================================"

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check environment variables
check_env() {
    print_status "Checking environment variables..."
    
    if [ ! -f .env.prod ]; then
        print_error "Production environment file (.env.prod) not found!"
        print_status "Please create .env.prod with the following variables:"
        echo "   DATABASE_URL=postgresql://user:password@host:port/db"
        echo "   SECRET_KEY=your-secret-key"
        echo "   ALLOWED_HOSTS=your-domain.com"
        echo "   DEBUG=false"
        exit 1
    fi
    
    print_success "Environment variables configured"
}

# Backup existing data
backup_data() {
    print_status "Creating database backup..."
    
    if docker ps -q -f name=cashflow-db-prod | grep -q .; then
        timestamp=$(date +%Y%m%d_%H%M%S)
        backup_file="backup_${timestamp}.sql"
        
        docker exec cashflow-db-prod pg_dump -U postgres cashflow > "backups/${backup_file}"
        print_success "Database backup created: backups/${backup_file}"
    else
        print_warning "No existing database found to backup"
    fi
}

# Stop existing containers
stop_existing() {
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    print_success "Existing containers stopped"
}

# Build production images
build_images() {
    print_status "Building production Docker images..."
    
    # Build with production settings
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    print_success "Production Docker images built successfully"
}

# Start production services
start_services() {
    print_status "Starting production services..."
    
    # Start with production compose file
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Production services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for production services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout=60
    while ! docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Database failed to start within 60 seconds"
            exit 1
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    print_success "Database is ready"
    
    # Wait for backend
    print_status "Waiting for backend..."
    timeout=60
    while ! curl -s http://localhost:8000/health > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Backend failed to start within 60 seconds"
            exit 1
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    print_success "Backend is ready"
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout=60
    while ! curl -s http://localhost:80 > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Frontend failed to start within 60 seconds"
            exit 1
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    print_success "Frontend is ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
    
    print_success "Database migrations completed"
}

# Show status
show_status() {
    echo ""
    echo "🎉 Cashflow Production Environment Started Successfully!"
    echo "======================================================="
    echo ""
    echo "📱 Frontend:     http://localhost:80"
    echo "🔧 Backend API:  http://localhost:8000"
    echo "🗄️  Database:     localhost:5432"
    echo ""
    echo "🐳 Docker Containers:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "📝 Useful Commands:"
    echo "   - View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   - Stop services: ./scripts/stop-docker-prod.sh"
    echo "   - Restart services: ./scripts/restart-docker-prod.sh"
    echo "   - Access database: docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d cashflow"
    echo "   - View backups: ls -la backups/"
    echo ""
    echo "⚠️  Production Mode Features:"
    echo "   - Optimized for performance"
    echo "   - Data persistence across restarts"
    echo "   - Automatic backups"
    echo "   - Health monitoring"
    echo ""
}

# Main execution
main() {
    check_docker
    check_env
    backup_data
    stop_existing
    build_images
    start_services
    wait_for_services
    run_migrations
    show_status
}

# Run main function
main "$@"
