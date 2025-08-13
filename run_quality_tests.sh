#!/bin/bash

# IPSC Quality Test Runner Wrapper
# Version: 1.7.0
# 
# This script provides a convenient way to run the comprehensive quality test suite
# and generate detailed reports for the IPSC application.

set -e

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

# Function to show usage
show_usage() {
    echo "IPSC Quality Test Runner"
    echo "Version: 1.7.0"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -f, --format FORMAT     Report format (json, html, both) [default: both]"
    echo "  -p, --project-root DIR  Project root directory [default: current directory]"
    echo "  -q, --quiet             Skip console summary output"
    echo "  -v, --version           Show version information"
    echo ""
    echo "Examples:"
    echo "  $0                      # Run all tests with both JSON and HTML reports"
    echo "  $0 -f html              # Generate only HTML report"
    echo "  $0 -f json -q           # Generate only JSON report, quiet mode"
    echo "  $0 -p /path/to/project  # Run tests for specific project directory"
    echo ""
    echo "The script will:"
    echo "  1. Run backend tests (pytest with coverage)"
    echo "  2. Run frontend tests (Vitest)"
    echo "  3. Run E2E tests (Playwright)"
    echo "  4. Run database tests"
    echo "  5. Run security tests"
    echo "  6. Run performance tests"
    echo "  7. Generate comprehensive quality report"
    echo ""
    echo "Reports will be saved in the 'quality_reports' directory."
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Python is available
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check if the quality test runner script exists
    if [ ! -f "quality_test_runner.py" ]; then
        print_error "quality_test_runner.py not found in current directory"
        exit 1
    fi
    
    # Check if we're in the right directory (look for key files)
    if [ ! -f "VERSION" ] && [ ! -f "build-info.json" ]; then
        print_warning "VERSION or build-info.json not found. Make sure you're in the project root."
    fi
    
    print_success "Prerequisites check passed"
}

# Function to show version
show_version() {
    echo "IPSC Quality Test Runner"
    echo "Version: 1.7.0"
    echo "Build Date: $(date)"
    echo "Python Version: $(python3 --version)"
    echo ""
    
    # Show project version if available
    if [ -f "VERSION" ]; then
        echo "Project Version: $(cat VERSION)"
    fi
    
    if [ -f "build-info.json" ]; then
        echo "Build Info: $(cat build-info.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('build_date', 'Unknown'))")"
    fi
}

# Parse command line arguments
FORMAT="both"
PROJECT_ROOT="."
QUIET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--version)
            show_version
            exit 0
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -p|--project-root)
            PROJECT_ROOT="$2"
            shift 2
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate format
if [[ "$FORMAT" != "json" && "$FORMAT" != "html" && "$FORMAT" != "both" ]]; then
    print_error "Invalid format: $FORMAT. Must be 'json', 'html', or 'both'"
    exit 1
fi

# Main execution
main() {
    echo "🚀 IPSC Quality Test Runner"
    echo "=========================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Build command
    CMD="python3 quality_test_runner.py --format $FORMAT --project-root $PROJECT_ROOT"
    
    if [ "$QUIET" = true ]; then
        CMD="$CMD --no-summary"
    fi
    
    print_status "Starting quality test execution..."
    print_status "Command: $CMD"
    echo ""
    
    # Execute the quality test runner
    if eval $CMD; then
        echo ""
        print_success "Quality test execution completed successfully!"
        
        # Show report locations
        if [ -d "quality_reports" ]; then
            echo ""
            print_status "Reports generated:"
            ls -la quality_reports/
        fi
        
        exit 0
    else
        echo ""
        print_error "Quality test execution failed!"
        exit 1
    fi
}

# Run main function
main "$@"
