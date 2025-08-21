#!/bin/bash

# Test Database Setup Script
# Creates and configures the test database for backend tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME="profitpath_test"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}🔧 Setting up Test Database${NC}"
echo "=================================="

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "FAILED")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Check if PostgreSQL is running
check_postgres() {
    print_status "INFO" "Checking PostgreSQL connection..."
    
    # Check if Docker container is running
    if docker ps | grep "docker-db-1" | grep -q "Up.*(healthy)"; then
        print_status "SUCCESS" "PostgreSQL Docker container is running and healthy"
    else
        print_status "FAILED" "PostgreSQL Docker container is not running"
        print_status "INFO" "Please start the database service first:"
        echo "  ./scripts/automated_deploy.sh full-pipeline dev"
        exit 1
    fi
    
    # Test connection using Docker
    if ! docker exec docker-db-1 pg_isready -U $DB_USER > /dev/null 2>&1; then
        print_status "FAILED" "PostgreSQL is not accessible"
        exit 1
    fi
    
    print_status "SUCCESS" "PostgreSQL is accessible"
}

# Create test database
create_test_db() {
    print_status "INFO" "Creating test database '$TEST_DB_NAME'..."
    
    # Check if database already exists using Docker
    if docker exec docker-db-1 psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $TEST_DB_NAME; then
        print_status "WARNING" "Test database '$TEST_DB_NAME' already exists"
        
        # For automated setup, always recreate the test database
        print_status "INFO" "Dropping existing test database for clean setup..."
        docker exec docker-db-1 dropdb -U $DB_USER $TEST_DB_NAME || true
    fi
    
    # Create the test database using Docker
    if docker exec docker-db-1 createdb -U $DB_USER $TEST_DB_NAME; then
        print_status "SUCCESS" "Test database '$TEST_DB_NAME' created successfully"
    else
        print_status "FAILED" "Failed to create test database"
        exit 1
    fi
}

# Initialize test database schema
init_test_schema() {
    print_status "INFO" "Initializing test database schema..."
    
    # Set environment variables for database connection
    export DATABASE_URL="postgresql+psycopg://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME"
    export TESTING="1"
    
    # Run database initialization
    cd backend
    if source ../venv/bin/activate && python -c "
import os
import sys
sys.path.append('.')
from app.db import init_db
from app.seed import run_seed

print('Creating database tables...')
init_db()

print('Running seed data...')
run_seed()

print('Test database initialization complete!')
"; then
        print_status "SUCCESS" "Test database schema initialized successfully"
    else
        print_status "FAILED" "Failed to initialize test database schema"
        exit 1
    fi
    cd ..
}

# Verify test database setup
verify_setup() {
    print_status "INFO" "Verifying test database setup..."
    
    # Test database connection using Docker
    if docker exec docker-db-1 psql -U $DB_USER -d $TEST_DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
        print_status "SUCCESS" "Test database connection verified"
    else
        print_status "FAILED" "Test database connection failed"
        exit 1
    fi
    
    # Check if tables exist using Docker
    table_count=$(docker exec docker-db-1 psql -U $DB_USER -d $TEST_DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    if [ "$table_count" -gt 0 ]; then
        print_status "SUCCESS" "Test database has $table_count tables"
    else
        print_status "WARNING" "No tables found in test database"
    fi
}

# Main execution
main() {
    echo ""
    print_status "INFO" "Starting test database setup..."
    
    # Check PostgreSQL
    check_postgres
    
    # Create test database
    create_test_db
    
    # Initialize schema
    init_test_schema
    
    # Verify setup
    verify_setup
    
    echo ""
    print_status "SUCCESS" "Test database setup completed successfully!"
    echo ""
    echo -e "${BLUE}📋 Test Database Information:${NC}"
    echo "  Database Name: $TEST_DB_NAME"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  User: $DB_USER"
    echo ""
    echo -e "${YELLOW}💡 You can now run tests with:${NC}"
    echo "  ./scripts/test-runner.sh backend"
    echo "  ./scripts/automated_deploy.sh test backend"
}

# Run main function
main "$@"
