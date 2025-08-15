#!/bin/bash

# Manual Test Execution Script for IPSC Application
# Version: 1.37.2
# Date: 2025-01-14

set -e  # Exit on any error

echo "🚀 Starting Manual Test Execution for IPSC Application"
echo "Version: 1.37.2"
echo "Date: $(date)"
echo "============================================================"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        print_status "Created directory: $1"
    fi
}

# Step 1: Environment Setup
print_status "Setting up test environment..."

# Check if we're in the right directory
if [ ! -f "VERSION" ]; then
    print_error "Please run this script from the IPSC project root directory"
    exit 1
fi

# Create test directories
create_dir "test_reports/$(date +%Y%m%d)"
create_dir "coverage_reports"
create_dir "quality_reports"

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    print_status "Activating virtual environment..."
    source .venv/bin/activate
else
    print_warning "Virtual environment not found. Please ensure dependencies are installed."
fi

# Step 2: Check Dependencies
print_status "Checking dependencies..."

# Check Python
if command_exists python3; then
    PYTHON_CMD="python3"
elif command_exists python; then
    PYTHON_CMD="python"
else
    print_error "Python not found. Please install Python 3.8+"
    exit 1
fi

print_success "Python found: $($PYTHON_CMD --version)"

# Check pip
if command_exists pip3; then
    PIP_CMD="pip3"
elif command_exists pip; then
    PIP_CMD="pip"
else
    print_error "pip not found. Please install pip"
    exit 1
fi

# Step 3: Install Test Dependencies
print_status "Installing test dependencies..."

$PIP_CMD install pytest coverage pytest-xml markdown > /dev/null 2>&1 || {
    print_warning "Some test dependencies may not be installed. Continuing..."
}

# Step 4: Run Backend Tests
print_status "Running backend tests..."

cd backend

# Set testing environment
export TESTING=1

# Create test results file
TEST_RESULTS_FILE="../test_reports/$(date +%Y%m%d)/backend_test_results.txt"
COVERAGE_FILE="../coverage_reports/backend_coverage.txt"

echo "Backend Test Results - $(date)" > "$TEST_RESULTS_FILE"
echo "================================================" >> "$TEST_RESULTS_FILE"

# Run tests with coverage
print_status "Running tests with coverage..."
$PYTHON_CMD -m coverage run -m pytest ../tests/backend/ -v >> "$TEST_RESULTS_FILE" 2>&1 || {
    print_warning "Some tests failed. Check the results file for details."
}

# Generate coverage report
print_status "Generating coverage report..."
$PYTHON_CMD -m coverage report > "$COVERAGE_FILE" 2>&1 || {
    print_warning "Coverage report generation failed."
}

# Generate HTML coverage report
$PYTHON_CMD -m coverage html -d ../coverage_reports/backend_html > /dev/null 2>&1 || {
    print_warning "HTML coverage report generation failed."
}

# Run tests with XML output
print_status "Generating JUnit XML report..."
$PYTHON_CMD -m pytest ../tests/backend/ -v --junitxml="../test_reports/$(date +%Y%m%d)/backend_tests.xml" > /dev/null 2>&1 || {
    print_warning "XML report generation failed."
}

cd ..

# Step 5: Generate Test Summary
print_status "Generating test summary..."

SUMMARY_FILE="test_reports/$(date +%Y%m%d)/test_summary.md"

cat > "$SUMMARY_FILE" << EOF
# Test Execution Summary

## Session Information
- **Date:** $(date)
- **Environment:** Development
- **Application Version:** 1.37.2
- **Python Version:** $($PYTHON_CMD --version)

## Test Results Overview

### Backend Tests
- **Total Tests:** $(grep -c "::" "$TEST_RESULTS_FILE" || echo "0")
- **Passed:** $(grep -c "PASSED" "$TEST_RESULTS_FILE" || echo "0")
- **Failed:** $(grep -c "FAILED" "$TEST_RESULTS_FILE" || echo "0")
- **Success Rate:** $(echo "scale=1; $(grep -c "PASSED" "$TEST_RESULTS_FILE" || echo "0") * 100 / $(grep -c "::" "$TEST_RESULTS_FILE" || echo "1")" | bc 2>/dev/null || echo "0")%

## Coverage Information
\`\`\`
$(cat "$COVERAGE_FILE" 2>/dev/null || echo "Coverage report not available")
\`\`\`

## Test Files Executed
$(find tests/backend -name "*.py" -type f | sed 's/^/- /')

## Critical Issues Found
$(grep -i "error\|fail\|exception" "$TEST_RESULTS_FILE" | head -10 | sed 's/^/- /' || echo "- No critical issues found")

## Recommendations
1. Review failed tests and fix issues
2. Improve test coverage for uncovered modules
3. Run manual tests for critical user workflows
4. Validate business logic with real data

## Next Steps
1. Execute manual test scenarios from \`tests/manual_test_scenarios.md\`
2. Review coverage reports in \`coverage_reports/\`
3. Address any critical issues found
4. Schedule regular test execution

## Files Generated
- Backend test results: \`$TEST_RESULTS_FILE\`
- Coverage report: \`$COVERAGE_FILE\`
- JUnit XML: \`test_reports/$(date +%Y%m%d)/backend_tests.xml\`
- HTML coverage: \`coverage_reports/backend_html/index.html\`
- Test summary: \`$SUMMARY_FILE\`

---
**Generated by:** Manual Test Execution Script  
**Version:** 1.37.2
EOF

# Step 6: Generate HTML Report
print_status "Generating HTML report..."

HTML_FILE="test_reports/$(date +%Y%m%d)/test_report.html"

$PYTHON_CMD -c "
import markdown
import sys

try:
    with open('$SUMMARY_FILE', 'r') as f:
        md_content = f.read()
    
    html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])
    
    html_template = f'''<!DOCTYPE html>
<html>
<head>
    <title>IPSC Test Report - $(date)</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #333; }}
        h2 {{ color: #666; margin-top: 30px; }}
        .success {{ color: green; }}
        .error {{ color: red; }}
        .warning {{ color: orange; }}
        pre {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
    <h1>IPSC Application Test Report</h1>
    <p><strong>Generated:</strong> $(date)</p>
    <p><strong>Version:</strong> 1.37.2</p>
    {html_content}
</body>
</html>'''
    
    with open('$HTML_FILE', 'w') as f:
        f.write(html_template)
    
    print('HTML report generated successfully')
except Exception as e:
    print(f'Error generating HTML report: {e}')
    sys.exit(1)
"

# Step 7: Display Results
print_status "Test execution completed!"
echo "============================================================"

# Display summary
echo "📊 Test Results Summary:"
echo "   - Backend Tests: $(grep -c "::" "$TEST_RESULTS_FILE" || echo "0") total"
echo "   - Passed: $(grep -c "PASSED" "$TEST_RESULTS_FILE" || echo "0")"
echo "   - Failed: $(grep -c "FAILED" "$TEST_RESULTS_FILE" || echo "0")"

# Display file locations
echo ""
echo "📁 Generated Reports:"
echo "   - Test Results: $TEST_RESULTS_FILE"
echo "   - Coverage Report: $COVERAGE_FILE"
echo "   - Test Summary: $SUMMARY_FILE"
echo "   - HTML Report: $HTML_FILE"
echo "   - JUnit XML: test_reports/$(date +%Y%m%d)/backend_tests.xml"

# Display coverage if available
if [ -f "$COVERAGE_FILE" ]; then
    echo ""
    echo "📈 Coverage Summary:"
    tail -5 "$COVERAGE_FILE" | grep -E "(TOTAL|TOTAL|TOTAL)" || echo "   Coverage report not available"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Review the generated reports"
echo "   2. Execute manual tests from tests/manual_test_scenarios.md"
echo "   3. Address any failed tests"
echo "   4. Validate business logic manually"

print_success "Manual test execution completed successfully!"
echo ""
echo "For detailed instructions, see: MANUAL_TEST_EXECUTION_GUIDE.md"
echo "For test scenarios, see: tests/manual_test_scenarios.md"
