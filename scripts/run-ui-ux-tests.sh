#!/bin/bash

# Comprehensive UI/UX Testing Framework Runner (MVP)
# This script runs all UI/UX tests for the ProfitPath application
# MVP Browser Support: Chrome and Firefox (Desktop only)
# Mobile and Responsive Design: Not included in MVP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="frontend"
TEST_RESULTS_DIR="test_reports/ui_ux_tests"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

echo -e "${BLUE}🧪 ProfitPath UI/UX Testing Framework${NC}"
echo -e "${BLUE}================================${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Function to print section header
print_section() {
    echo -e "\n${YELLOW}$1${NC}"
    echo -e "${YELLOW}$(printf '%.0s=' {1..50})${NC}"
}

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to check if services are running
check_services() {
    print_section "Checking Services Status"
    
    # Check if Docker containers are running
    if docker compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_result 0 "Docker services are running"
    else
        print_result 1 "Docker services are not running"
        echo "Starting services..."
        docker compose -f docker-compose.dev.yml up -d
        sleep 30
    fi
    
    # Check if frontend is accessible
    if curl -s http://localhost:5173 > /dev/null; then
        print_result 0 "Frontend is accessible"
    else
        print_result 1 "Frontend is not accessible"
        return 1
    fi
    
    # Check if backend is accessible
    if curl -s http://localhost:8000/health > /dev/null; then
        print_result 0 "Backend is accessible"
    else
        print_result 1 "Backend is not accessible"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_section "Installing Dependencies"
    
    cd "$FRONTEND_DIR"
    
    # Install npm dependencies
    if npm install; then
        print_result 0 "NPM dependencies installed"
    else
        print_result 1 "Failed to install NPM dependencies"
        return 1
    fi
    
    # Install Playwright browsers (MVP: Chrome and Firefox only)
    if npx playwright install --with-deps chromium firefox; then
        print_result 0 "Playwright browsers installed (Chrome and Firefox)"
    else
        print_result 1 "Failed to install Playwright browsers"
        return 1
    fi
    
    cd ..
}

# Function to run specific test suite
run_test_suite() {
    local suite_name="$1"
    local test_file="$2"
    local output_file="$TEST_RESULTS_DIR/${suite_name}_${TIMESTAMP}.json"
    
    print_section "Running $suite_name Tests"
    
    cd "$FRONTEND_DIR"
    
    if npx playwright test "$test_file" --reporter=json --output="$output_file"; then
        print_result 0 "$suite_name tests completed successfully"
        
        # Parse and display results
        if [ -f "$output_file" ]; then
            local passed=$(jq '.stats.passed' "$output_file" 2>/dev/null || echo "0")
            local failed=$(jq '.stats.failed' "$output_file" 2>/dev/null || echo "0")
            local total=$(jq '.stats.total' "$output_file" 2>/dev/null || echo "0")
            
            echo "  Results: $passed passed, $failed failed, $total total"
        fi
    else
        print_result 1 "$suite_name tests failed"
        return 1
    fi
    
    cd ..
}

# Function to run all story tests
run_story_tests() {
    print_section "Running Story-Specific Tests"
    
    local test_files=(
        "story-16-gst-toggle.spec.ts"
        "story-17-gst-reports.spec.ts"
        "story-18-advanced-invoices.spec.ts"
        "story-19-purchase-orders.spec.ts"
        "story-20-payment-tracking.spec.ts"
        "story-21-inventory-management.spec.ts"
        "story-22-financial-reports.spec.ts"
    )
    
    local total_passed=0
    local total_failed=0
    
    for test_file in "${test_files[@]}"; do
        if [ -f "$FRONTEND_DIR/tests/e2e/$test_file" ]; then
            local suite_name=$(basename "$test_file" .spec.ts)
            if run_test_suite "$suite_name" "tests/e2e/$test_file"; then
                ((total_passed++))
            else
                ((total_failed++))
            fi
        else
            echo -e "${YELLOW}⚠️  Test file not found: $test_file${NC}"
        fi
    done
    
    echo ""
    echo -e "${BLUE}Story Tests Summary:${NC}"
    echo "  Passed: $total_passed"
    echo "  Failed: $total_failed"
    echo "  Total: $((total_passed + total_failed))"
}

# Function to run UI fixes tests
run_ui_fixes_tests() {
    print_section "Running UI Fixes Tests"
    
    if run_test_suite "ui-fixes" "tests/e2e/ui-fixes.spec.ts"; then
        print_result 0 "UI fixes tests completed"
    else
        print_result 1 "UI fixes tests failed"
        return 1
    fi
}

# Function to run accessibility tests
run_accessibility_tests() {
    print_section "Running Accessibility Tests"
    
    cd "$FRONTEND_DIR"
    
    # Run accessibility tests
    if npx playwright test --grep "accessibility" --reporter=json --output="$TEST_RESULTS_DIR/accessibility_${TIMESTAMP}.json"; then
        print_result 0 "Accessibility tests completed"
    else
        print_result 1 "Accessibility tests failed"
    fi
    
    cd ..
}

# Function to run responsive design tests
run_responsive_tests() {
    print_section "Running Responsive Design Tests"
    
    cd "$FRONTEND_DIR"
    
    # Run responsive tests on different viewports
    local viewports=("375x667" "768x1024" "1920x1080")
    
    for viewport in "${viewports[@]}"; do
        echo "Testing viewport: $viewport"
        if npx playwright test --grep "responsive" --project="Mobile Chrome" --reporter=json --output="$TEST_RESULTS_DIR/responsive_${viewport}_${TIMESTAMP}.json"; then
            print_result 0 "Responsive tests for $viewport completed"
        else
            print_result 1 "Responsive tests for $viewport failed"
        fi
    done
    
    cd ..
}

# Function to run performance tests
run_performance_tests() {
    print_section "Running Performance Tests"
    
    cd "$FRONTEND_DIR"
    
    # Run performance tests
    if npx playwright test --grep "performance" --reporter=json --output="$TEST_RESULTS_DIR/performance_${TIMESTAMP}.json"; then
        print_result 0 "Performance tests completed"
    else
        print_result 1 "Performance tests failed"
    fi
    
    cd ..
}

# Function to generate test report
generate_report() {
    print_section "Generating Test Report"
    
    local report_file="$TEST_RESULTS_DIR/ui_ux_test_report_${TIMESTAMP}.html"
    
    cd "$FRONTEND_DIR"
    
    # Generate HTML report
    if npx playwright show-report "$TEST_RESULTS_DIR"; then
        print_result 0 "Test report generated"
        echo "Report location: $TEST_RESULTS_DIR"
    else
        print_result 1 "Failed to generate test report"
    fi
    
    cd ..
}

# Function to run all tests
run_all_tests() {
    print_section "Running Complete UI/UX Test Suite"
    
    local start_time=$(date +%s)
    
    # Run all test categories
    run_story_tests
    run_ui_fixes_tests
    run_accessibility_tests
    run_responsive_tests
    run_performance_tests
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo -e "${BLUE}Test Execution Summary:${NC}"
    echo "  Total execution time: ${duration} seconds"
    echo "  Results saved to: $TEST_RESULTS_DIR"
}

# Function to cleanup
cleanup() {
    print_section "Cleanup"
    
    # Stop any running Playwright processes
    pkill -f playwright || true
    
    echo "Cleanup completed"
}

# Main execution
main() {
    echo -e "${BLUE}Starting UI/UX Testing Framework...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.dev.yml" ]; then
        echo -e "${RED}Error: Please run this script from the project root directory${NC}"
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-all}" in
        "services")
            check_services
            ;;
        "install")
            install_dependencies
            ;;
        "stories")
            run_story_tests
            ;;
        "ui-fixes")
            run_ui_fixes_tests
            ;;
        "accessibility")
            run_accessibility_tests
            ;;
        "responsive")
            run_responsive_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "report")
            generate_report
            ;;
        "all")
            check_services
            install_dependencies
            run_all_tests
            generate_report
            ;;
        *)
            echo "Usage: $0 [services|install|stories|ui-fixes|accessibility|responsive|performance|report|all]"
            echo ""
            echo "Options:"
            echo "  services      - Check if required services are running"
            echo "  install       - Install dependencies"
            echo "  stories       - Run story-specific tests"
            echo "  ui-fixes      - Run UI fixes tests"
            echo "  accessibility - Run accessibility tests"
            echo "  responsive    - Run responsive design tests"
            echo "  performance   - Run performance tests"
            echo "  report        - Generate test report"
            echo "  all           - Run all tests (default)"
            exit 1
            ;;
    esac
    
    cleanup
    
    echo ""
    echo -e "${GREEN}🎉 UI/UX Testing Framework completed!${NC}"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
