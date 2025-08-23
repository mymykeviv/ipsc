#!/bin/bash

# Quick Docker Build Script
# Usage: ./scripts/quick-docker-build.sh [version] [dockerhub-username]

set -e  # Exit on any error

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

# Get version and Docker Hub username
VERSION=${1:-$(cat VERSION 2>/dev/null || echo "1.4.5")}
DOCKERHUB_USERNAME=${2:-"your-dockerhub-username"}

print_status "INFO" "Quick Docker Build for IPSC v$VERSION"
print_status "INFO" "Docker Hub Username: $DOCKERHUB_USERNAME"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_status "FAILED" "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if logged into Docker Hub
if ! docker info | grep -q "Username"; then
    print_status "WARNING" "Not logged into Docker Hub. Please run: docker login"
    exit 1
fi

print_status "INFO" "Starting quick build process..."

# Build and push backend
print_status "INFO" "Building backend..."
if docker build \
    --platform linux/amd64,linux/arm64 \
    --target production \
    -t "$DOCKERHUB_USERNAME/profitpath-backend:$VERSION" \
    -t "$DOCKERHUB_USERNAME/profitpath-backend:latest" \
    backend/; then
    
    print_status "SUCCESS" "Backend image built successfully"
    
    print_status "INFO" "Pushing backend image..."
    if docker push "$DOCKERHUB_USERNAME/profitpath-backend:$VERSION" && \
       docker push "$DOCKERHUB_USERNAME/profitpath-backend:latest"; then
        print_status "SUCCESS" "Backend image pushed successfully"
    else
        print_status "FAILED" "Failed to push backend image"
        exit 1
    fi
else
    print_status "FAILED" "Failed to build backend image"
    exit 1
fi

# Build and push frontend
print_status "INFO" "Building frontend..."
if docker build \
    --platform linux/amd64,linux/arm64 \
    --target production \
    -t "$DOCKERHUB_USERNAME/profitpath-frontend:$VERSION" \
    -t "$DOCKERHUB_USERNAME/profitpath-frontend:latest" \
    frontend/; then
    
    print_status "SUCCESS" "Frontend image built successfully"
    
    print_status "INFO" "Pushing frontend image..."
    if docker push "$DOCKERHUB_USERNAME/profitpath-frontend:$VERSION" && \
       docker push "$DOCKERHUB_USERNAME/profitpath-frontend:latest"; then
        print_status "SUCCESS" "Frontend image pushed successfully"
    else
        print_status "FAILED" "Failed to push frontend image"
        exit 1
    fi
else
    print_status "FAILED" "Failed to build frontend image"
    exit 1
fi

print_status "SUCCESS" "🎉 Quick build and push completed successfully!"
print_status "INFO" "🐳 Images pushed to Docker Hub:"
echo "  - $DOCKERHUB_USERNAME/profitpath-backend:$VERSION"
echo "  - $DOCKERHUB_USERNAME/profitpath-frontend:$VERSION"
print_status "INFO" "📋 Next steps:"
echo "  1. Test images locally: docker run -p 8000:8000 $DOCKERHUB_USERNAME/profitpath-backend:$VERSION"
echo "  2. Use in docker-compose.yml with the new image tags"
echo "  3. For deployment packages, run: ./scripts/build-and-push-docker.sh $VERSION $DOCKERHUB_USERNAME"
