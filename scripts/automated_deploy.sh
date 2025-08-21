#!/bin/bash

# Automated Deployment Script - Local CI/CD Simulation
# This script simulates what the GitHub Actions workflows would do

set -e  # Exit on any error

echo "🚀 AUTOMATED DEPLOYMENT PIPELINE"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to run tests
run_tests() {
    local test_type=${1:-all}
    print_status "INFO" "Running $test_type tests..."
    
    # Ensure services are running before tests
    print_status "INFO" "Ensuring services are running..."
    local running_services=$(docker compose -f deployment/docker/docker-compose.dev.yml ps --services --filter "status=running" | wc -l)
    local total_services=$(docker compose -f deployment/docker/docker-compose.dev.yml config --services | wc -l)
    
    if [ "$running_services" -lt "$total_services" ]; then
        print_status "WARNING" "Not all services are running. Starting services..."
        docker compose -f deployment/docker/docker-compose.dev.yml up -d
        print_status "INFO" "Waiting for services to be ready..."
        sleep 30
    else
        print_status "SUCCESS" "All services are already running"
    fi
    
    # Run the unified test runner
    if ./scripts/test-runner.sh $test_type; then
        print_status "SUCCESS" "$test_type tests passed!"
        return 0
    else
        print_status "FAILED" "$test_type tests failed - deployment blocked"
        return 1
    fi
}

# Function to deploy
deploy() {
    local environment=$1
    print_status "INFO" "Deploying to $environment environment..."
    
    cd deployment/docker
    
    # Stop existing containers
    print_status "INFO" "Stopping existing containers..."
    docker-compose -f docker-compose.$environment.yml down || true
    
    # Start new deployment
    print_status "INFO" "Starting new deployment..."
    if docker-compose -f docker-compose.$environment.yml up -d; then
        print_status "SUCCESS" "Deployment started successfully"
        
        # Wait for services to be ready
        print_status "INFO" "Waiting for services to be ready..."
        sleep 30
        
        # Run post-deployment tests
        print_status "INFO" "Running post-deployment health checks..."
        cd ../..
        if ./scripts/test-runner.sh health; then
            print_status "SUCCESS" "Post-deployment tests passed!"
            return 0
        else
            print_status "FAILED" "Post-deployment tests failed - rolling back"
            rollback $environment
            return 1
        fi
    else
        print_status "FAILED" "Deployment failed"
        return 1
    fi
}

# Function to rollback
rollback() {
    local environment=$1
    print_status "WARNING" "Rolling back $environment deployment..."
    
    cd deployment/docker
    docker-compose -f docker-compose.$environment.yml down
    print_status "INFO" "Rollback completed"
    cd ../..
}

# Function to monitor health
monitor_health() {
    print_status "INFO" "Starting health monitoring..."
    
    # Check backend health
    if curl -f -s http://localhost:8000/docs > /dev/null; then
        print_status "SUCCESS" "Backend is healthy"
    else
        print_status "FAILED" "Backend is unhealthy"
        return 1
    fi
    
    # Check frontend health (adjust port as needed)
    if curl -f -s http://localhost:5173 > /dev/null 2>&1; then
        print_status "SUCCESS" "Frontend is healthy"
    else
        print_status "WARNING" "Frontend health check failed (may be starting up)"
    fi
    
    # Check database health
    if docker ps | grep -q "docker-db-1.*healthy"; then
        print_status "SUCCESS" "Database is healthy"
    else
        print_status "FAILED" "Database is unhealthy"
        return 1
    fi
}

# Function to show deployment status
show_status() {
    echo ""
    echo "📊 DEPLOYMENT STATUS"
    echo "===================="
    
    # Show running containers
    echo "Running Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep docker- || echo "No containers running"
    
    echo ""
    echo "Service Health:"
    monitor_health
    
    echo ""
    echo "Recent Test Results:"
    # Find the most recent test summary
    local latest_summary=$(find test_reports -name "test_summary_*.md" -type f 2>/dev/null | sort | tail -1)
    if [ -n "$latest_summary" ]; then
        echo "Latest Test Summary: $latest_summary"
        echo "Test Results:"
        # Extract key metrics from the summary
        if grep -q "Success Rate:" "$latest_summary"; then
            grep -E "(Success Rate|Total Tests|Passed|Failed):" "$latest_summary" | head -4
        else
            echo "Test summary format not recognized"
        fi
    else
        echo "No test results available"
    fi
}

# Main execution
main() {
    local action=$1
    local environment=${2:-dev}
    
    case $action in
        "test")
            local test_type=${2:-all}
            run_tests $test_type
            ;;
        "deploy")
            if run_tests all; then
                deploy $environment
            else
                print_status "FAILED" "Deployment blocked due to test failures"
                exit 1
            fi
            ;;
        "monitor")
            monitor_health
            ;;
        "status")
            show_status
            ;;
        "rollback")
            rollback $environment
            ;;
        "test-backend")
            run_tests backend
            ;;
        "test-frontend")
            run_tests frontend
            ;;
        "test-e2e")
            run_tests e2e
            ;;
        "test-health")
            run_tests health
            ;;
        "test-only")
            local test_type=${2:-all}
            print_status "INFO" "Running $test_type tests (assuming services are running)..."
            if ./scripts/test-runner.sh $test_type; then
                print_status "SUCCESS" "$test_type tests passed!"
            else
                print_status "FAILED" "$test_type tests failed"
                exit 1
            fi
            ;;
        "full-pipeline")
            print_status "INFO" "Running full CI/CD pipeline..."
            if run_tests all; then
                if deploy $environment; then
                    print_status "SUCCESS" "Full pipeline completed successfully!"
                    show_status
                else
                    print_status "FAILED" "Deployment failed in pipeline"
                    exit 1
                fi
            else
                print_status "FAILED" "Tests failed in pipeline"
                exit 1
            fi
            ;;
        *)
            echo "Usage: $0 {test|test-only|deploy|monitor|status|rollback|full-pipeline} [environment] [test_type]"
            echo ""
            echo "Commands:"
            echo "  test           - Run tests (default: all tests) - starts services if needed"
            echo "  test-only      - Run tests without starting services"
            echo "  deploy         - Deploy to environment (default: dev)"
            echo "  monitor        - Check application health"
            echo "  status         - Show deployment status"
            echo "  rollback       - Rollback deployment"
            echo "  full-pipeline  - Run complete CI/CD pipeline"
            echo ""
            echo "Environments: dev, uat, prod"
            echo "Test Types: backend, frontend, e2e, health, all"
            echo ""
            echo "Examples:"
            echo "  $0 test                    # Run all tests (starts services if needed)"
            echo "  $0 test-only               # Run all tests (assumes services are running)"
            echo "  $0 test backend            # Run only backend tests"
            echo "  $0 test e2e                # Run only E2E tests"
            echo "  $0 deploy dev              # Deploy to dev"
            echo "  $0 full-pipeline prod      # Full pipeline to prod"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
