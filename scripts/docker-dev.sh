#!/bin/bash

# Docker Development Deployment Script
# This script deploys the application using Docker for development testing

set -e

echo "🐳 Starting Docker Development Environment"
echo "=========================================="

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

# Stop existing containers
stop_existing() {
    print_status "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    print_success "Existing containers stopped"
}

# Build images
build_images() {
    print_status "Building Docker images..."
    
    # Build with development settings
    docker-compose -f docker-compose.dev.yml build --no-cache
    
    print_success "Docker images built successfully"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start with development compose file
    docker-compose -f docker-compose.dev.yml up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout=30
    while ! docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Database failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Database is ready"
    
    # Wait for backend
    print_status "Waiting for backend..."
    timeout=30
    while ! curl -s http://localhost:8000/health > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Backend failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Backend is ready"
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout=30
    while ! curl -s http://localhost:5173 > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Frontend failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Frontend is ready"
}

# Show status
show_status() {
    echo ""
    echo "🎉 Cashflow Development Environment Started Successfully!"
    echo "========================================================"
    echo ""
    echo "📱 Frontend:     http://localhost:5173"
    echo "🔧 Backend API:  http://localhost:8000"
    echo "📧 MailHog:      http://localhost:8025"
    echo "🗄️  Database:     localhost:5432"
    echo ""
    echo "🐳 Docker Containers:"
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    echo "📝 Useful Commands:"
    echo "   - View logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "   - Stop services: ./scripts/stop-docker-dev.sh"
    echo "   - Restart services: ./scripts/restart-docker-dev.sh"
    echo "   - Access database: docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d cashflow"
    echo ""
}

# Main execution
main() {
    check_docker
    stop_existing
    build_images
    start_services
    wait_for_services
    show_status
}

# Run main function
main "$@"
