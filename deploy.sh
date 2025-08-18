#!/bin/bash

# Simple Deployment Script for Cashflow
# Usage: ./deploy.sh [dev|staging|prod] [--clean] [--test] [--skip-tests]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
CLEAN_BUILD=false
RUN_TESTS=true
SKIP_TESTS=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --test)
            RUN_TESTS=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            RUN_TESTS=false
            shift
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use: dev, staging, or prod${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Starting Cashflow Deployment${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Clean Build: $CLEAN_BUILD${NC}"
echo -e "${BLUE}Run Tests: $RUN_TESTS${NC}"
echo "=================================="

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Error: Git is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to clean environment
clean_environment() {
    if [ "$CLEAN_BUILD" = true ]; then
        echo -e "${YELLOW}Cleaning environment...${NC}"
        docker-compose down --volumes --remove-orphans 2>/dev/null || true
        docker system prune -f 2>/dev/null || true
        echo -e "${GREEN}✅ Environment cleaned${NC}"
    fi
}

# Function to run tests
run_tests() {
    if [ "$RUN_TESTS" = true ] && [ "$SKIP_TESTS" = false ]; then
        echo -e "${YELLOW}Running tests...${NC}"
        
        # Check if virtual environment exists
        if [ ! -d ".venv" ]; then
            echo -e "${RED}Error: Virtual environment not found. Please create one with: python3 -m venv .venv${NC}"
            exit 1
        fi
        
        # Backend tests
        echo -e "${BLUE}Running backend tests...${NC}"
        cd backend
        source ../.venv/bin/activate
        python -m pytest tests/ -v --tb=short || {
            echo -e "${RED}❌ Backend tests failed${NC}"
            exit 1
        }
        deactivate
        cd ..
        
        # Frontend tests
        echo -e "${BLUE}Running frontend tests...${NC}"
        cd frontend
        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}Installing frontend dependencies...${NC}"
            npm install
        fi
        npm test -- --run --reporter=verbose || {
            echo -e "${RED}❌ Frontend tests failed${NC}"
            exit 1
        }
        cd ..
        
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${YELLOW}Skipping tests${NC}"
    fi
}

# Function to build and deploy
build_and_deploy() {
    echo -e "${YELLOW}Building and deploying services...${NC}"
    
    # Build and start services
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.optimized.yml up -d --build
    else
        docker-compose up -d --build
    fi
    
    echo -e "${GREEN}✅ Services deployed successfully${NC}"
}

# Function to check service health
check_health() {
    echo -e "${YELLOW}Checking service health...${NC}"
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        exit 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All services are healthy${NC}"
}

# Function to show deployment info
show_info() {
    echo -e "${BLUE}==================================${NC}"
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    echo -e "${BLUE}Backend: http://localhost:8000${NC}"
    echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}API Docs: http://localhost:8000/docs${NC}"
    echo -e "${BLUE}==================================${NC}"
}

# Main deployment flow
main() {
    check_prerequisites
    clean_environment
    run_tests
    build_and_deploy
    check_health
    show_info
}

# Run main function
main "$@"
