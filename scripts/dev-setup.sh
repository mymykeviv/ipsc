#!/bin/bash

# ProfitPath Local Development Setup Script
# This script sets up the local Docker development environment

set -e

echo "🚀 Setting up ProfitPath Local Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Stop and remove existing containers
cleanup_existing() {
    print_status "Cleaning up existing containers..."
    docker-compose -f docker-compose.local.yml down -v 2>/dev/null || true
    docker-compose -f docker-compose.yml down -v 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
    print_success "Existing containers cleaned up"
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    docker-compose -f docker-compose.local.yml up -d --build
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    timeout=60
    counter=0
    while ! docker exec profitpath-postgres-local pg_isready -U postgres > /dev/null 2>&1; do
        sleep 1
        counter=$((counter + 1))
        if [ $counter -ge $timeout ]; then
            print_error "PostgreSQL failed to start within $timeout seconds"
            exit 1
        fi
    done
    print_success "PostgreSQL is ready"
}

# Run database migration
run_migration() {
    print_status "Running database migration..."
    if [ -f "backend/cashflow.db" ]; then
        print_status "Found existing SQLite database, migrating to PostgreSQL..."
        cd backend
        python3 migrate_to_postgresql.py
        cd ..
        print_success "Database migration completed"
    else
        print_warning "No existing SQLite database found, starting with fresh PostgreSQL"
    fi
}

# Wait for backend to be ready
wait_for_backend() {
    print_status "Waiting for backend to be ready..."
    timeout=120
    counter=0
    while ! curl -f http://localhost:8000/health > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "Backend failed to start within $timeout seconds"
            exit 1
        fi
    done
    print_success "Backend is ready"
}

# Wait for frontend to be ready
wait_for_frontend() {
    print_status "Waiting for frontend to be ready..."
    timeout=120
    counter=0
    while ! curl -f http://localhost:5173 > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_warning "Frontend may still be starting up..."
            break
        fi
    done
    print_success "Frontend is ready"
}

# Show status
show_status() {
    echo ""
    echo "🎉 ProfitPath Local Development Environment is Ready!"
    echo "=================================================="
    echo ""
    echo "📊 Services Status:"
    docker-compose -f docker-compose.local.yml ps
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend:  http://localhost:5173"
    echo "   Backend:   http://localhost:8000"
    echo "   API Docs:  http://localhost:8000/docs"
    echo "   MailHog:   http://localhost:8025"
    echo ""
    echo "🗄️  Database:"
    echo "   Host:      localhost"
    echo "   Port:      5432"
    echo "   Database:  profitpath"
    echo "   User:      postgres"
    echo "   Password:  postgres"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View logs:     docker-compose -f docker-compose.local.yml logs -f"
    echo "   Stop services: docker-compose -f docker-compose.local.yml down"
    echo "   Restart:       docker-compose -f docker-compose.local.yml restart"
    echo ""
}

# Main execution
main() {
    check_docker
    cleanup_existing
    start_services
    run_migration
    wait_for_backend
    wait_for_frontend
    show_status
}

# Run main function
main "$@"
