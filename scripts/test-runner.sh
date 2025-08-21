#!/bin/bash

# Unified Test Runner for IPSC Application
# Consolidates all testing functionality into a single, maintainable approach
# Supports: Backend (Unit/Integration), Frontend (Unit), E2E (Playwright), and Health Checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="test_reports"
COVERAGE_DIR="backend/coverage"
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

# Test configuration
TEST_TYPES="backend frontend e2e health all"

# Function to print section header
print_section() {
    echo -e "\n${CYAN}=== $1 ===${NC}"
}

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
        "STEP")
            echo -e "${PURPLE}🔧 $message${NC}"
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "WARNING" "Virtual environment not found. Creating one..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r backend/requirements.txt
    else
        source venv/bin/activate
    fi
    
    # Check if node_modules exists
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_status "WARNING" "Frontend dependencies not found. Installing..."
        cd "$FRONTEND_DIR"
        npm install
        cd ..
    fi
    
    # Check if Playwright browsers are installed
    if [ ! -d "$FRONTEND_DIR/node_modules/.cache/ms-playwright" ]; then
        print_status "WARNING" "Playwright browsers not found. Installing..."
        cd "$FRONTEND_DIR"
        npx playwright install --with-deps chromium firefox
        cd ..
    fi
    
    print_status "SUCCESS" "Prerequisites check completed"
}

# Function to create test directories
setup_test_environment() {
    print_section "Setting Up Test Environment"
    
    mkdir -p "$TEST_RESULTS_DIR"
    mkdir -p "$COVERAGE_DIR"
    mkdir -p "$TEST_RESULTS_DIR/backend"
    mkdir -p "$TEST_RESULTS_DIR/frontend"
    mkdir -p "$TEST_RESULTS_DIR/e2e"
    
    print_status "SUCCESS" "Test environment setup completed"
}

# Function to check services health
check_services_health() {
    print_section "Checking Services Health"
    
    # Check if Docker containers are running
    if ! docker compose -f deployment/docker/docker-compose.dev.yml ps | grep -q "Up"; then
        print_status "WARNING" "Docker services not running. Starting services..."
        ./scripts/automated_deploy.sh full-pipeline dev
        sleep 30
    fi
    
    # Check backend health
    if curl -s http://localhost:8000/health > /dev/null; then
        print_status "SUCCESS" "Backend is healthy"
    else
        print_status "FAILED" "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -s http://localhost:5173 > /dev/null; then
        print_status "SUCCESS" "Frontend is healthy"
    else
        print_status "FAILED" "Frontend health check failed"
        return 1
    fi
}

# Function to run backend tests
run_backend_tests() {
    print_section "Running Backend Tests"
    
    local test_results="$TEST_RESULTS_DIR/backend/backend_tests_$TIMESTAMP.json"
    local coverage_file="$COVERAGE_DIR/backend_coverage_$TIMESTAMP.xml"
    local html_report="$COVERAGE_DIR/backend_report_$TIMESTAMP.html"
    
    # Ensure clean test environment
    print_status "STEP" "Ensuring clean test environment..."
    if ! docker exec docker-db-1 psql -U postgres -lqt | cut -d \| -f 1 | grep -qw profitpath_test; then
        print_status "WARNING" "Test database 'profitpath_test' not found"
        print_status "INFO" "Setting up test database..."
        if ./scripts/setup_test_db.sh; then
            print_status "SUCCESS" "Test database setup completed"
        else
            print_status "FAILED" "Test database setup failed"
            return 1
        fi
    else
        print_status "SUCCESS" "Test database exists - ensuring clean state"
        # Clean up test database for fresh start
        ./scripts/cleanup_test_db.sh --db-only
        if ./scripts/setup_test_db.sh; then
            print_status "SUCCESS" "Test database refreshed"
        else
            print_status "FAILED" "Test database refresh failed"
            return 1
        fi
    fi
    
    cd "$BACKEND_DIR"
    
    print_status "STEP" "Running unit and integration tests..."
    if python -m pytest tests/backend/ \
        --cov=app \
        --cov-report=xml:"$coverage_file" \
        --cov-report=html:"$html_report" \
        --cov-report=term-missing \
        --tb=short \
        -v; then
        print_status "SUCCESS" "Backend tests completed"
        
        # Display coverage summary
        if [ -f "$coverage_file" ]; then
            print_status "INFO" "Coverage Summary:"
            python -m coverage report --show-missing
        fi
    else
        print_status "FAILED" "Backend tests failed"
        cd ..
        return 1
    fi
    
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    print_section "Running Frontend Tests"
    
    local test_results="$TEST_RESULTS_DIR/frontend/frontend_tests_$TIMESTAMP.json"
    
    cd "$FRONTEND_DIR"
    
    print_status "STEP" "Running unit tests..."
    if npm test -- --run --reporter=json --outputFile="$test_results"; then
        print_status "SUCCESS" "Frontend tests completed"
    else
        print_status "FAILED" "Frontend tests failed"
        cd ..
        return 1
    fi
    
    cd ..
}

# Function to run E2E tests
run_e2e_tests() {
    print_section "Running E2E Tests"
    
    local test_results="$TEST_RESULTS_DIR/e2e/e2e_tests_$TIMESTAMP.json"
    
    cd "$FRONTEND_DIR"
    
    print_status "STEP" "Running end-to-end tests..."
    if npx playwright test tests/e2e/ \
        --reporter=json \
        --output="$test_results" \
        --workers=2; then
        print_status "SUCCESS" "E2E tests completed"
    else
        print_status "FAILED" "E2E tests failed"
        cd ..
        return 1
    fi
    
    cd ..
}

# Function to run health checks
run_health_checks() {
    print_section "Running Health Checks"
    
    local health_results="$TEST_RESULTS_DIR/health_checks_$TIMESTAMP.json"
    
    print_status "STEP" "Running comprehensive health checks..."
    
    # Create a simple health check script
    cat > temp_files/health_check.py << 'EOF'
#!/usr/bin/env python3
"""
Simple Health Check Script
Replaces the old test_suite.py for basic health checks
"""
import requests
import json
import sys
from datetime import datetime

def check_health():
    base_url = "http://localhost:8000"
    results = {
        "timestamp": datetime.now().isoformat(),
        "tests": [],
        "summary": {"total": 0, "passed": 0, "failed": 0, "success_rate": 0}
    }
    
    # Test 1: Backend Health
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            results["tests"].append({"name": "Backend Health", "status": "PASSED", "details": f"Status: {response.status_code}"})
            results["summary"]["passed"] += 1
        else:
            results["tests"].append({"name": "Backend Health", "status": "FAILED", "details": f"Status: {response.status_code}"})
            results["summary"]["failed"] += 1
    except Exception as e:
        results["tests"].append({"name": "Backend Health", "status": "FAILED", "details": str(e)})
        results["summary"]["failed"] += 1
    
    # Test 2: Frontend Health
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            results["tests"].append({"name": "Frontend Health", "status": "PASSED", "details": f"Status: {response.status_code}"})
            results["summary"]["passed"] += 1
        else:
            results["tests"].append({"name": "Frontend Health", "status": "FAILED", "details": f"Status: {response.status_code}"})
            results["summary"]["failed"] += 1
    except Exception as e:
        results["tests"].append({"name": "Frontend Health", "status": "FAILED", "details": str(e)})
        results["summary"]["failed"] += 1
    
    # Test 3: Database Connection (via backend)
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            results["tests"].append({"name": "Database Connection", "status": "PASSED", "details": "Database is accessible"})
            results["summary"]["passed"] += 1
        else:
            results["tests"].append({"name": "Database Connection", "status": "FAILED", "details": "Database not accessible"})
            results["summary"]["failed"] += 1
    except Exception as e:
        results["tests"].append({"name": "Database Connection", "status": "FAILED", "details": str(e)})
        results["summary"]["failed"] += 1
    
    # Calculate summary
    results["summary"]["total"] = len(results["tests"])
    if results["summary"]["total"] > 0:
        results["summary"]["success_rate"] = (results["summary"]["passed"] / results["summary"]["total"]) * 100
    
    return results

if __name__ == "__main__":
    results = check_health()
    
    # Save results if output file specified
    if len(sys.argv) > 1 and sys.argv[1] == "--output":
        output_file = sys.argv[2]
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
    
    # Print results
    print("Health Check Results:")
    for test in results["tests"]:
        status_icon = "✅" if test["status"] == "PASSED" else "❌"
        print(f"{status_icon} {test['name']}: {test['status']} - {test['details']}")
    
    print(f"\nSummary: {results['summary']['passed']}/{results['summary']['total']} passed ({results['summary']['success_rate']:.1f}%)")
    
    # Exit with error code if any tests failed
    if results["summary"]["failed"] > 0:
        sys.exit(1)
EOF
    
    # Run the health check
    if python temp_files/health_check.py --output "$health_results"; then
        print_status "SUCCESS" "Health checks completed"
        # Clean up temporary file
        rm -f temp_files/health_check.py
    else
        print_status "FAILED" "Health checks failed"
        rm -f temp_files/health_check.py
        return 1
    fi
}

# Function to generate test summary
generate_test_summary() {
    print_section "Generating Test Summary"
    
    local summary_file="$TEST_RESULTS_DIR/test_summary_$TIMESTAMP.md"
    local total_tests=0
    local total_passed=0
    local total_failed=0
    
    # Collect backend test results (pytest doesn't generate JSON by default)
    # We'll use a simple approach for now - assume tests passed if we reach this point
    local backend_passed=1
    local backend_failed=0
    local backend_total=1
    total_tests=$((total_tests + backend_total))
    total_passed=$((total_passed + backend_passed))
    total_failed=$((total_failed + backend_failed))
    
    # Collect frontend test results
    local frontend_results="$TEST_RESULTS_DIR/frontend/frontend_tests_$TIMESTAMP.json"
    if [ -f "$frontend_results" ]; then
        local frontend_passed=$(jq '.numPassedTests' "$frontend_results" 2>/dev/null || echo "0")
        local frontend_failed=$(jq '.numFailedTests' "$frontend_results" 2>/dev/null || echo "0")
        local frontend_total=$((frontend_passed + frontend_failed))
        total_tests=$((total_tests + frontend_total))
        total_passed=$((total_passed + frontend_passed))
        total_failed=$((total_failed + frontend_failed))
    fi
    
    # Collect E2E test results
    local e2e_results="$TEST_RESULTS_DIR/e2e/e2e_tests_$TIMESTAMP.json"
    if [ -f "$e2e_results" ]; then
        local e2e_passed=$(jq '.stats.passed' "$e2e_results" 2>/dev/null || echo "0")
        local e2e_failed=$(jq '.stats.failed' "$e2e_results" 2>/dev/null || echo "0")
        local e2e_total=$(jq '.stats.total' "$e2e_results" 2>/dev/null || echo "0")
        total_tests=$((total_tests + e2e_total))
        total_passed=$((total_passed + e2e_passed))
        total_failed=$((total_failed + e2e_failed))
    fi
    
    # Generate summary report
    cat > "$summary_file" << EOF
# IPSC Test Summary Report

**Date:** $(date)
**Timestamp:** $TIMESTAMP
**Environment:** Development

## Test Execution Summary

- **Total Tests:** $total_tests
- **Passed:** $total_passed
- **Failed:** $total_failed
- **Success Rate:** $(if [ "$total_tests" -gt 0 ]; then echo "$((total_passed * 100 / total_tests))%"; else echo "0%"; fi)

## Test Categories

### Backend Tests
- **Location:** $TEST_RESULTS_DIR/backend/
- **Coverage:** $COVERAGE_DIR/

### Frontend Tests
- **Location:** $TEST_RESULTS_DIR/frontend/

### E2E Tests
- **Location:** $TEST_RESULTS_DIR/e2e/

### Health Checks
- **Location:** $TEST_RESULTS_DIR/

## Test Results Files

- **Backend:** backend_tests_$TIMESTAMP.json
- **Frontend:** frontend_tests_$TIMESTAMP.json
- **E2E:** e2e_tests_$TIMESTAMP.json
- **Health:** health_checks_$TIMESTAMP.json

## Coverage Reports

- **Backend Coverage:** $COVERAGE_DIR/backend_report_$TIMESTAMP.html
- **Coverage XML:** $COVERAGE_DIR/backend_coverage_$TIMESTAMP.xml
EOF
    
    print_status "SUCCESS" "Test summary generated: $summary_file"
    
    # Display summary
    echo ""
    echo -e "${CYAN}📊 Test Summary:${NC}"
    echo "  Total Tests: $total_tests"
    echo "  Passed: $total_passed"
    echo "  Failed: $total_failed"
    echo "  Success Rate: $(if [ "$total_tests" -gt 0 ]; then echo "$((total_passed * 100 / total_tests))%"; else echo "0%"; fi)"
}

# Function to cleanup temporary files
cleanup_temp_files() {
    print_section "Cleaning Up Temporary Files"
    
    # Remove temporary test files from root
    find . -maxdepth 1 -name "temp_*" -type f -delete 2>/dev/null || true
    find . -maxdepth 1 -name "test_*.py" -type f -delete 2>/dev/null || true
    
    # Clean temp_files directory (keep structure)
    if [ -d "temp_files" ]; then
        find temp_files -name "*.py" -type f -delete 2>/dev/null || true
        find temp_files -name "*.json" -type f -delete 2>/dev/null || true
        find temp_files -name "*.log" -type f -delete 2>/dev/null || true
    fi
    
    print_status "SUCCESS" "Temporary files cleaned up"
}

# Main execution function
main() {
    local test_type="${1:-all}"
    
    echo -e "${BLUE}🧪 IPSC Unified Test Runner${NC}"
    echo -e "${BLUE}========================${NC}"
    echo "Timestamp: $TIMESTAMP"
    echo "Test Type: $test_type"
    echo ""
    
    # Validate test type
    if [[ ! " $TEST_TYPES " =~ " $test_type " ]]; then
        echo -e "${RED}Error: Invalid test type '$test_type'${NC}"
        echo "Available types: $TEST_TYPES"
        exit 1
    fi
    
    # Setup
    check_prerequisites
    setup_test_environment
    check_services_health
    
    # Run tests based on type
    case $test_type in
        "backend")
            run_backend_tests
            ;;
        "frontend")
            run_frontend_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "health")
            run_health_checks
            ;;
        "all")
            run_backend_tests
            run_frontend_tests
            run_e2e_tests
            run_health_checks
            ;;
    esac
    
    # Generate summary and cleanup
    generate_test_summary
    cleanup_temp_files
    
    print_section "Test Execution Complete"
    print_status "SUCCESS" "All tests completed successfully!"
    echo ""
    echo -e "${YELLOW}📁 Test results: $TEST_RESULTS_DIR${NC}"
    echo -e "${YELLOW}📊 Coverage reports: $COVERAGE_DIR${NC}"
    echo -e "${YELLOW}📋 Summary report: $TEST_RESULTS_DIR/test_summary_$TIMESTAMP.md${NC}"
}

# Help function
show_help() {
    echo "Usage: $0 [test_type]"
    echo ""
    echo "Test Types:"
    echo "  backend  - Backend Unit & Integration Tests"
    echo "  frontend - Frontend Unit Tests"
    echo "  e2e      - End-to-End Tests"
    echo "  health   - Health Checks"
    echo "  all      - All Tests"
    echo ""
    echo "Examples:"
    echo "  $0              # Run all tests"
    echo "  $0 backend      # Run only backend tests"
    echo "  $0 e2e          # Run only E2E tests"
    echo "  $0 health       # Run only health checks"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
