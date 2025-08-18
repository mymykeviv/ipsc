#!/bin/bash

# Comprehensive Test Runner for CASHFLOW
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="backend/tests"
COVERAGE_DIR="backend/coverage"
REPORTS_DIR="backend/test_reports"

echo -e "${BLUE}🧪 Starting CASHFLOW Comprehensive Test Suite${NC}"

# Create directories
mkdir -p "$COVERAGE_DIR"
mkdir -p "$REPORTS_DIR"

# Function to run tests with coverage
run_tests_with_coverage() {
    local test_type=$1
    local test_path=$2
    local coverage_file="$COVERAGE_DIR/${test_type}_coverage.xml"
    local report_file="$REPORTS_DIR/${test_type}_report.html"
    
    echo -e "${YELLOW}Running ${test_type} tests...${NC}"
    
    cd backend
    python -m pytest "$test_path" \
        --cov=app \
        --cov-report=xml:"$coverage_file" \
        --cov-report=html:"$report_file" \
        --cov-report=term-missing \
        --tb=short \
        -v
    cd ..
}

# Function to run specific test categories
run_test_category() {
    local category=$1
    local pattern=$2
    
    echo -e "${YELLOW}Running ${category} tests...${NC}"
    cd backend
    python -m pytest "$pattern" -v --tb=short
    cd ..
}

# 1. Unit Tests
echo -e "${GREEN}📋 Phase 1: Unit Tests${NC}"
run_test_category "Unit" "tests/test_*.py"

# 2. Integration Tests
echo -e "${GREEN}📋 Phase 2: Integration Tests${NC}"
run_test_category "Integration" "tests/test_*_integration.py"

# 3. API Tests
echo -e "${GREEN}📋 Phase 3: API Tests${NC}"
run_test_category "API" "tests/test_*_api.py"

# 4. Full Coverage Test
echo -e "${GREEN}📋 Phase 4: Full Coverage Test${NC}"
run_tests_with_coverage "full" "tests/"

# 5. Performance Tests (if available)
if [ -d "backend/tests/performance" ]; then
    echo -e "${GREEN}📋 Phase 5: Performance Tests${NC}"
    run_test_category "Performance" "tests/performance/"
fi

# 6. Security Tests (if available)
if [ -d "backend/tests/security" ]; then
    echo -e "${GREEN}📋 Phase 6: Security Tests${NC}"
    run_test_category "Security" "tests/security/"
fi

# Generate test summary
echo -e "${GREEN}📊 Generating Test Summary...${NC}"
cd backend
python -m pytest tests/ --tb=no -q --junitxml="$REPORTS_DIR/junit.xml"
cd ..

# Display coverage summary
if [ -f "$COVERAGE_DIR/full_coverage.xml" ]; then
    echo -e "${GREEN}📈 Coverage Summary:${NC}"
    cd backend
    python -m coverage report --show-missing
    cd ..
fi

echo -e "${GREEN}✅ Test Suite Completed!${NC}"
echo -e "${YELLOW}📁 Coverage reports: $COVERAGE_DIR${NC}"
echo -e "${YELLOW}📁 Test reports: $REPORTS_DIR${NC}"
echo -e "${YELLOW}📊 HTML coverage report: $COVERAGE_DIR/full_coverage.xml${NC}"
echo -e "${YELLOW}📋 JUnit report: $REPORTS_DIR/junit.xml${NC}"
