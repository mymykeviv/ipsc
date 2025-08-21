#!/bin/bash

# Test Database Cleanup Script
# Removes test databases and ensures clean test environment

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

echo -e "${BLUE}🧹 Test Database Cleanup${NC}"
echo "=============================="

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

# Check if PostgreSQL container is running
check_postgres() {
    print_status "INFO" "Checking PostgreSQL container..."
    
    if ! docker ps | grep "docker-db-1" | grep -q "Up.*(healthy)"; then
        print_status "FAILED" "PostgreSQL Docker container is not running"
        exit 1
    fi
    
    print_status "SUCCESS" "PostgreSQL container is running"
}

# Drop test database
drop_test_db() {
    print_status "INFO" "Dropping test database '$TEST_DB_NAME'..."
    
    if docker exec docker-db-1 psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $TEST_DB_NAME; then
        if docker exec docker-db-1 dropdb -U $DB_USER $TEST_DB_NAME; then
            print_status "SUCCESS" "Test database '$TEST_DB_NAME' dropped successfully"
        else
            print_status "FAILED" "Failed to drop test database"
            exit 1
        fi
    else
        print_status "WARNING" "Test database '$TEST_DB_NAME' does not exist"
    fi
}

# Clean up test files
cleanup_test_files() {
    print_status "INFO" "Cleaning up test files..."
    
    # Remove test reports
    if [ -d "test_reports" ]; then
        rm -rf test_reports/*
        print_status "SUCCESS" "Test reports cleaned"
    fi
    
    # Remove coverage reports
    if [ -d "backend/coverage" ]; then
        rm -rf backend/coverage/*
        print_status "SUCCESS" "Coverage reports cleaned"
    fi
    
    # Remove temporary test files
    if [ -d "temp_files" ]; then
        find temp_files -name "*.py" -type f -delete
        print_status "SUCCESS" "Temporary test files cleaned"
    fi
    
    # Remove pytest cache
    if [ -d ".pytest_cache" ]; then
        rm -rf .pytest_cache
        print_status "SUCCESS" "Pytest cache cleaned"
    fi
}

# Main execution
main() {
    print_status "INFO" "Starting test database cleanup..."
    
    # Check PostgreSQL
    check_postgres
    
    # Drop test database
    drop_test_db
    
    # Clean up test files
    cleanup_test_files
    
    print_status "SUCCESS" "Test environment cleanup completed!"
    echo ""
    echo -e "${YELLOW}💡 You can now run a fresh test setup with:${NC}"
    echo "  ./scripts/setup_test_db.sh"
    echo "  ./scripts/test-runner.sh backend"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  -h, --help     Show this help message"
        echo "  --db-only      Only clean test database"
        echo "  --files-only   Only clean test files"
        echo ""
        echo "Examples:"
        echo "  $0              # Full cleanup"
        echo "  $0 --db-only    # Only clean database"
        echo "  $0 --files-only # Only clean files"
        exit 0
        ;;
    --db-only)
        check_postgres
        drop_test_db
        print_status "SUCCESS" "Database cleanup completed!"
        exit 0
        ;;
    --files-only)
        cleanup_test_files
        print_status "SUCCESS" "File cleanup completed!"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
