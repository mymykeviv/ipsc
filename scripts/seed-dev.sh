#!/bin/bash

# Development Seed Script for ProfitPath
# This script populates the development database with seed data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "backend/app/main.py" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    print_warning "Virtual environment not detected. Please activate it first."
    print_status "Run: source .venv/bin/activate"
    exit 1
fi

# Set development environment
export ENVIRONMENT="development"

print_status "🌱 Starting development seed data creation..."

# Check if PostgreSQL is running
if ! docker exec profitpath-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    print_error "PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Check if database exists
if ! docker exec profitpath-postgres-dev psql -U postgres -lqt | cut -d \| -f 1 | grep -qw profitpath; then
    print_warning "Database 'profitpath' does not exist. Creating it..."
    docker exec profitpath-postgres-dev createdb -U postgres profitpath
    print_success "Database 'profitpath' created"
fi

# Run the development seed script
print_status "Running development seed script..."
cd backend

if python -c "from app.dev_seed import run_dev_seed; run_dev_seed()"; then
    print_success "Development seed data created successfully!"
else
    print_error "Failed to create development seed data"
    exit 1
fi

cd ..

print_success "🎉 Development environment is ready!"
print_status "You can now start the application with: ./scripts/local-dev.sh"
print_status "Login credentials: admin / admin123"
