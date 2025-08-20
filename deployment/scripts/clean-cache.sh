#!/bin/bash

# Comprehensive Cache Cleaning Script for Cashflow
# Usage: ./clean-cache.sh [environment]
# Environments: dev, uat, prod

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENVIRONMENT=${1:-dev}

echo -e "${BLUE}🧹 Starting comprehensive cache cleaning for $ENVIRONMENT environment${NC}"
echo "=================================="

# Function to clean frontend caches
clean_frontend_caches() {
    echo -e "${YELLOW}Cleaning frontend caches...${NC}"
    
    # Remove compiled JavaScript files that override TypeScript source
    find frontend/src -name "*.js" -type f | while read -r js_file; do
        ts_file="${js_file%.js}.tsx"
        if [ ! -f "$ts_file" ]; then
            ts_file="${js_file%.js}.ts"
        fi
        
        if [ -f "$ts_file" ]; then
            echo "Removing $js_file (overrides $ts_file)"
            rm "$js_file"
        fi
    done
    
    # Remove source maps
    find frontend/src -name "*.js.map" -type f -delete
    
    # Clean build directories
    if [ -d "frontend/dist" ]; then
        echo "Removing frontend/dist directory"
        rm -rf frontend/dist
    fi
    
    if [ -d "frontend/build" ]; then
        echo "Removing frontend/build directory"
        rm -rf frontend/build
    fi
    
    # Clean node_modules if requested (for clean builds)
    if [ "$ENVIRONMENT" = "prod" ] || [ "$2" = "--full" ]; then
        if [ -d "frontend/node_modules" ]; then
            echo "Removing frontend/node_modules directory"
            rm -rf frontend/node_modules
        fi
    fi
    
    echo -e "${GREEN}✅ Frontend caches cleaned${NC}"
}

# Function to clean backend caches
clean_backend_caches() {
    echo -e "${YELLOW}Cleaning backend caches...${NC}"
    
    # Remove Python cache files
    find backend -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find backend -name "*.pyc" -type f -delete 2>/dev/null || true
    find backend -name "*.pyo" -type f -delete 2>/dev/null || true
    
    # Remove test cache
    if [ -d "backend/.pytest_cache" ]; then
        rm -rf backend/.pytest_cache
    fi
    
    # Clean virtual environment if requested
    if [ "$ENVIRONMENT" = "prod" ] || [ "$2" = "--full" ]; then
        if [ -d ".venv" ]; then
            echo "Removing virtual environment for clean rebuild"
            rm -rf .venv
        fi
    fi
    
    echo -e "${GREEN}✅ Backend caches cleaned${NC}"
}

# Function to clean Docker caches
clean_docker_caches() {
    echo -e "${YELLOW}Cleaning Docker caches...${NC}"
    
    # Remove unused containers
    docker container prune -f 2>/dev/null || true
    
    # Remove unused images
    docker image prune -f 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f 2>/dev/null || true
    
    # Remove unused networks
    docker network prune -f 2>/dev/null || true
    
    # Full system prune for production
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker system prune -af 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Docker caches cleaned${NC}"
}

# Function to clean Kubernetes caches (for production)
clean_kubernetes_caches() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${YELLOW}Cleaning Kubernetes caches...${NC}"
        
        # Clear kubectl cache
        kubectl config view --raw >/dev/null 2>&1 || true
        
        # Clear any local k8s cache files
        if [ -d "$HOME/.kube/cache" ]; then
            rm -rf "$HOME/.kube/cache"
        fi
        
        echo -e "${GREEN}✅ Kubernetes caches cleaned${NC}"
    fi
}

# Function to clean system caches
clean_system_caches() {
    echo -e "${YELLOW}Cleaning system caches...${NC}"
    
    # Clear npm cache
    npm cache clean --force 2>/dev/null || true
    
    # Clear pip cache
    pip cache purge 2>/dev/null || true
    
    # Clear git cache
    git gc --prune=now 2>/dev/null || true
    
    echo -e "${GREEN}✅ System caches cleaned${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting cache cleaning process...${NC}"
    
    # Clean frontend caches
    clean_frontend_caches "$@"
    
    # Clean backend caches
    clean_backend_caches "$@"
    
    # Clean Docker caches
    clean_docker_caches "$@"
    
    # Clean Kubernetes caches (production only)
    clean_kubernetes_caches "$@"
    
    # Clean system caches
    clean_system_caches "$@"
    
    echo -e "${GREEN}🎉 All caches cleaned successfully!${NC}"
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    echo -e "${BLUE}Timestamp: $(date)${NC}"
}

# Run main function
main "$@"
