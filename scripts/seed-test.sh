#!/bin/bash

# Test Seed Script for ProfitPath
# This script populates the test database with test-specific seed data

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

# Set testing environment
export ENVIRONMENT="testing"

print_status "🧪 Starting test seed data creation..."

# Check if PostgreSQL is running
if ! docker exec profitpath-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    print_error "PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Check if test database exists
if ! docker exec profitpath-postgres-dev psql -U postgres -lqt | cut -d \| -f 1 | grep -qw profitpath_test; then
    print_warning "Test database 'profitpath_test' does not exist. Creating it..."
    docker exec profitpath-postgres-dev createdb -U postgres profitpath_test
    print_success "Test database 'profitpath_test' created"
fi

# Run the test seed script
print_status "Running test seed script..."
cd backend

if python -c "from app.test_seed import run_test_seed; run_test_seed()"; then
    print_success "Test seed data created successfully!"
else
    print_error "Failed to create test seed data"
    exit 1
fi

cd ..

print_success "🎉 Test environment is ready!"
print_status "You can now run tests with: python -m pytest tests/"
print_status "Test login credentials: testadmin / test123"
