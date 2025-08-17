#!/bin/bash

# Comprehensive Test Runner for All GitHub Issues (1-22)
# This script executes UI automation tests and identifies broken UI journeys

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="frontend"
TEST_RESULTS_DIR="test_reports/github_issues_tests"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$TEST_RESULTS_DIR/github_issues_test_report_$TIMESTAMP.json"

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

echo -e "${BLUE}🧪 GitHub Issues 1-22 UI Automation Test Runner${NC}"
echo -e "${BLUE}================================================${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Function to print section header
print_section() {
    echo -e "\n${YELLOW}$1${NC}"
    echo -e "${YELLOW}$(printf '%.0s=' {1..60})${NC}"
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
    
    # Install Playwright browsers (Chrome and Firefox only for MVP)
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
    local test_file="$1"
    local test_name="$2"
    
    print_section "Running $test_name"
    
    cd "$FRONTEND_DIR"
    
    # Run the specific test file
    if npx playwright test "tests/e2e/$test_file" --reporter=json --output="$REPORT_FILE"; then
        print_result 0 "$test_name completed successfully"
    else
        print_result 1 "$test_name failed"
        return 1
    fi
    
    cd ..
}

# Function to run all GitHub issues tests
run_all_github_issues_tests() {
    print_section "Running All GitHub Issues Tests"
    
    cd "$FRONTEND_DIR"
    
    # Run the comprehensive test file
    if npx playwright test "tests/e2e/all-github-issues.spec.ts" --reporter=json --output="$REPORT_FILE"; then
        print_result 0 "All GitHub Issues tests completed"
    else
        print_result 1 "Some GitHub Issues tests failed"
        return 1
    fi
    
    cd ..
}

# Function to analyze test results
analyze_test_results() {
    print_section "Analyzing Test Results"
    
    if [ -f "$REPORT_FILE" ]; then
        echo "Test results saved to: $REPORT_FILE"
        
        # Extract test statistics
        local total_tests=$(jq '.stats.total' "$REPORT_FILE" 2>/dev/null || echo "0")
        local passed_tests=$(jq '.stats.passed' "$REPORT_FILE" 2>/dev/null || echo "0")
        local failed_tests=$(jq '.stats.failed' "$REPORT_FILE" 2>/dev/null || echo "0")
        
        echo "Test Statistics:"
        echo "  Total Tests: $total_tests"
        echo "  Passed: $passed_tests"
        echo "  Failed: $failed_tests"
        
        # Extract failed tests
        if [ "$failed_tests" -gt 0 ]; then
            echo ""
            echo -e "${RED}Failed Tests:${NC}"
            jq -r '.results[] | select(.status == "failed") | .spec.title' "$REPORT_FILE" 2>/dev/null || echo "No failed tests found"
            
            echo ""
            echo -e "${RED}Broken UI Journeys Identified:${NC}"
            jq -r '.results[] | select(.status == "failed") | "Issue: " + (.spec.title | split(":")[0]) + " - " + .spec.title' "$REPORT_FILE" 2>/dev/null || echo "No broken journeys found"
        fi
        
        # Generate summary report
        generate_summary_report "$total_tests" "$passed_tests" "$failed_tests"
        
    else
        echo -e "${RED}Test results file not found${NC}"
        return 1
    fi
}

# Function to generate summary report
generate_summary_report() {
    local total_tests="$1"
    local passed_tests="$2"
    local failed_tests="$3"
    
    local summary_file="$TEST_RESULTS_DIR/github_issues_summary_$TIMESTAMP.md"
    
    cat > "$summary_file" << EOF
# GitHub Issues 1-22 Test Summary Report

**Date:** $(date)
**Timestamp:** $TIMESTAMP
**Environment:** Development

## Test Execution Summary

- **Total Tests:** $total_tests
- **Passed:** $passed_tests
- **Failed:** $failed_tests
- **Success Rate:** $(if [ "$total_tests" -gt 0 ]; then echo "$((passed_tests * 100 / total_tests))%"; else echo "0%"; fi)

## GitHub Issues Coverage

### ✅ Working Issues
$(if [ "$passed_tests" -gt 0 ]; then
    jq -r '.results[] | select(.status == "passed") | "- " + (.spec.title | split(":")[0])' "$REPORT_FILE" 2>/dev/null | sort | uniq || echo "No passed tests found"
else
    echo "No tests passed"
fi)

### ❌ Broken Issues
$(if [ "$failed_tests" -gt 0 ]; then
    jq -r '.results[] | select(.status == "failed") | "- " + (.spec.title | split(":")[0])' "$REPORT_FILE" 2>/dev/null | sort | uniq || echo "No failed tests found"
else
    echo "No tests failed"
fi)

## Known Issues Status

### Previously Identified Issues
1. **Invoice List Issues** - $(if jq -r '.results[] | select(.spec.title | contains("invoice list")) | .status' "$REPORT_FILE" 2>/dev/null | grep -q "failed"; then echo "❌ STILL BROKEN"; else echo "✅ FIXED"; fi)
2. **Payment Form Issues** - $(if jq -r '.results[] | select(.spec.title | contains("payment form")) | .status' "$REPORT_FILE" 2>/dev/null | grep -q "failed"; then echo "❌ STILL BROKEN"; else echo "✅ FIXED"; fi)
3. **Expense Edit Prefilling** - $(if jq -r '.results[] | select(.spec.title | contains("expense edit")) | .status' "$REPORT_FILE" 2>/dev/null | grep -q "failed"; then echo "❌ STILL BROKEN"; else echo "✅ FIXED"; fi)
4. **GST Reports UI** - $(if jq -r '.results[] | select(.spec.title | contains("GST Reports")) | .status' "$REPORT_FILE" 2>/dev/null | grep -q "failed"; then echo "❌ STILL BROKEN"; else echo "✅ FIXED"; fi)
5. **Date Filter Dropdowns** - $(if jq -r '.results[] | select(.spec.title | contains("date filter")) | .status' "$REPORT_FILE" 2>/dev/null | grep -q "failed"; then echo "❌ STILL BROKEN"; else echo "✅ FIXED"; fi)
6. **Side Menu Collapsible** - $(if jq -r '.results[] | select(.spec.title | contains("side menu")) | .status' "$REPORT_FILE" 2>/dev/null | grep -q "failed"; then echo "❌ STILL BROKEN"; else echo "✅ FIXED"; fi)

## Recommendations

### Immediate Actions Required
$(if [ "$failed_tests" -gt 0 ]; then
    echo "1. Fix broken UI journeys identified above"
    echo "2. Re-run tests to verify fixes"
    echo "3. Update documentation for working features"
else
    echo "1. All tests passed - no immediate actions required"
    echo "2. Consider adding more edge case tests"
    echo "3. Update user documentation"
fi)

### Next Steps
1. Implement fixes for broken UI journeys
2. Add more comprehensive test coverage
3. Set up continuous testing in CI/CD pipeline
4. Create user acceptance testing scenarios

## Test Details

Full test results are available in: \`$REPORT_FILE\`

EOF

    echo "Summary report generated: $summary_file"
}

# Function to run specific issue tests
run_specific_issue_tests() {
    local issue_number="$1"
    
    print_section "Running Tests for Issue #$issue_number"
    
    cd "$FRONTEND_DIR"
    
    # Run tests for specific issue
    if npx playwright test "tests/e2e/all-github-issues.spec.ts" --grep "Issue #$issue_number" --reporter=json --output="$REPORT_FILE"; then
        print_result 0 "Issue #$issue_number tests completed"
    else
        print_result 1 "Issue #$issue_number tests failed"
        return 1
    fi
    
    cd ..
}

# Function to run known issues tests
run_known_issues_tests() {
    print_section "Running Known Issues Tests"
    
    cd "$FRONTEND_DIR"
    
    # Run known issues tests
    if npx playwright test "tests/e2e/all-github-issues.spec.ts" --grep "Known Issues Integration" --reporter=json --output="$REPORT_FILE"; then
        print_result 0 "Known issues tests completed"
    else
        print_result 1 "Known issues tests failed"
        return 1
    fi
    
    cd ..
}

# Function to show test report
show_test_report() {
    print_section "Test Report"
    
    if [ -f "$REPORT_FILE" ]; then
        echo "Opening test report..."
        npx playwright show-report "$REPORT_FILE" 2>/dev/null || echo "Report viewer not available"
    else
        echo "No test report available"
    fi
}

# Main execution
main() {
    local command="${1:-all}"
    
    case "$command" in
        "all")
            check_services
            install_dependencies
            run_all_github_issues_tests
            analyze_test_results
            show_test_report
            ;;
        "known-issues")
            check_services
            install_dependencies
            run_known_issues_tests
            analyze_test_results
            ;;
        "issue")
            if [ -z "$2" ]; then
                echo "Usage: $0 issue <issue_number>"
                exit 1
            fi
            check_services
            install_dependencies
            run_specific_issue_tests "$2"
            analyze_test_results
            ;;
        "report")
            show_test_report
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  all              Run all GitHub issues tests"
            echo "  known-issues     Run only known issues tests"
            echo "  issue <number>   Run tests for specific issue number"
            echo "  report           Show test report"
            echo "  help             Show this help message"
            ;;
        *)
            echo "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"
