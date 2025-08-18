#!/bin/bash

# Development Deployment Script
# Quick deployment for development environment
# Usage: ./scripts/deploy-dev.sh [--skip-tests]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_TESTS=false
for arg in "$@"; do
    case $arg in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
    esac
done

echo -e "${BLUE}🚀 Starting Development Deployment...${NC}"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        echo -e "${RED}Error: Virtual environment not found. Please create one with: python3 -m venv .venv${NC}"
        exit 1
    fi
    
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
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = false ]; then
        echo -e "${YELLOW}🧪 Running tests...${NC}"
        
        # Activate virtual environment for backend tests
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
        echo -e "${YELLOW}⏭️ Skipping tests (--skip-tests flag used)${NC}"
    fi
}

# Function to deploy services
deploy_services() {
    echo -e "${YELLOW}Deploying services...${NC}"
    
    # Stop existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    docker-compose up -d --build
    
    echo -e "${GREEN}✅ Services deployed successfully${NC}"
}

# Function to check service health
check_health() {
    echo -e "${YELLOW}Checking service health...${NC}"
    
    # Wait for services to start
    sleep 5
    
    # Check backend health
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All services are healthy${NC}"
}

# Function to show deployment info
show_info() {
    echo -e "${BLUE}==================================${NC}"
    echo -e "${GREEN}🎉 Development deployment completed!${NC}"
    echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}Backend: http://localhost:8000${NC}"
    echo -e "${BLUE}API Docs: http://localhost:8000/docs${NC}"
    echo -e "${BLUE}==================================${NC}"
}

# Main deployment flow
main() {
    check_prerequisites
    run_tests
    deploy_services
    check_health
    show_info
}

# Run main function
main "$@"
