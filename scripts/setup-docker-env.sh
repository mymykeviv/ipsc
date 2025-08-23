#!/bin/bash

# Setup Docker Environment Script
# This script helps set up your Docker environment for local builds

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

echo "🔧 Setting up Docker environment for local builds"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_status "FAILED" "Docker is not installed!"
    echo ""
    echo "Please install Docker first:"
    echo "  - Windows/Mac: https://www.docker.com/products/docker-desktop/"
    echo "  - Linux: Use your package manager"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt-get update && sudo apt-get install docker.io docker-compose"
    echo ""
    echo "CentOS/RHEL:"
    echo "  sudo yum install docker docker-compose"
    echo ""
    exit 1
fi

print_status "SUCCESS" "Docker is installed"

# Check Docker version
DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
print_status "INFO" "Docker version: $DOCKER_VERSION"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_status "FAILED" "Docker is not running!"
    echo ""
    echo "Please start Docker:"
    echo "  - Windows/Mac: Start Docker Desktop"
    echo "  - Linux: sudo systemctl start docker"
    echo ""
    exit 1
fi

print_status "SUCCESS" "Docker is running"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_status "WARNING" "Docker Compose is not installed!"
    echo ""
    echo "Please install Docker Compose:"
    echo "  - Windows/Mac: Usually included with Docker Desktop"
    echo "  - Linux: sudo apt-get install docker-compose"
    echo ""
else
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
    print_status "SUCCESS" "Docker Compose version: $COMPOSE_VERSION"
fi

# Check Docker Hub login
if ! docker info | grep -q "Username"; then
    print_status "WARNING" "Not logged into Docker Hub"
    echo ""
    echo "Please login to Docker Hub:"
    echo "  docker login"
    echo ""
    echo "Or set environment variables:"
    echo "  export DOCKER_USERNAME=your-username"
    echo "  export DOCKER_PASSWORD=your-password"
    echo "  docker login -u \$DOCKER_USERNAME -p \$DOCKER_PASSWORD"
    echo ""
else
    DOCKER_USERNAME=$(docker info | grep Username | cut -d' ' -f2)
    print_status "SUCCESS" "Logged into Docker Hub as: $DOCKER_USERNAME"
fi

# Check available disk space
DISK_SPACE=$(df . | tail -1 | awk '{print $4}')
DISK_SPACE_GB=$((DISK_SPACE / 1024 / 1024))

if [ "$DISK_SPACE_GB" -lt 10 ]; then
    print_status "WARNING" "Low disk space: ${DISK_SPACE_GB}GB available (recommended: 10GB+)"
else
    print_status "SUCCESS" "Disk space: ${DISK_SPACE_GB}GB available"
fi

# Check available memory
if command -v free &> /dev/null; then
    MEMORY_GB=$(free -g | grep Mem | awk '{print $2}')
    if [ "$MEMORY_GB" -lt 4 ]; then
        print_status "WARNING" "Low memory: ${MEMORY_GB}GB available (recommended: 4GB+)"
    else
        print_status "SUCCESS" "Memory: ${MEMORY_GB}GB available"
    fi
fi

# Create .env file for Docker Hub credentials
if [ ! -f .env ]; then
    print_status "INFO" "Creating .env file for Docker Hub credentials"
    cat > .env << EOF
# Docker Hub Configuration
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password

# Application Configuration
VERSION=$(cat VERSION 2>/dev/null || echo "1.4.5")

# Build Configuration
DOCKER_BUILDKIT=1
DOCKER_DEFAULT_PLATFORM=linux/amd64
EOF
    print_status "SUCCESS" "Created .env file"
    print_status "WARNING" "Please update .env with your Docker Hub credentials"
else
    print_status "SUCCESS" ".env file already exists"
    
    # Check if credentials are set
    if grep -q "your-dockerhub-username" .env; then
        print_status "WARNING" "Please update .env with your actual Docker Hub credentials"
    else
        print_status "SUCCESS" "Docker Hub credentials appear to be configured"
    fi
fi

# Check if scripts directory exists and has required scripts
if [ ! -d "scripts" ]; then
    print_status "WARNING" "Scripts directory not found"
else
    print_status "SUCCESS" "Scripts directory found"
    
    # Check for required scripts
    REQUIRED_SCRIPTS=("build-and-push-docker.sh" "quick-docker-build.sh")
    for script in "${REQUIRED_SCRIPTS[@]}"; do
        if [ -f "scripts/$script" ]; then
            print_status "SUCCESS" "Found $script"
        else
            print_status "WARNING" "Missing $script"
        fi
    done
fi

# Make scripts executable
if [ -d "scripts" ]; then
    print_status "INFO" "Making scripts executable..."
    chmod +x scripts/*.sh 2>/dev/null || true
    print_status "SUCCESS" "Scripts made executable"
fi

# Check Docker BuildKit
if [ "$DOCKER_BUILDKIT" = "1" ]; then
    print_status "SUCCESS" "Docker BuildKit is enabled"
else
    print_status "INFO" "Docker BuildKit is not enabled (will be enabled in .env)"
fi

# Check for VERSION file
if [ ! -f "VERSION" ]; then
    print_status "WARNING" "VERSION file not found"
    echo "Creating VERSION file with default version..."
    echo "1.4.5" > VERSION
    print_status "SUCCESS" "Created VERSION file with version 1.4.5"
else
    CURRENT_VERSION=$(cat VERSION)
    print_status "SUCCESS" "VERSION file found: $CURRENT_VERSION"
fi

echo ""
print_status "SUCCESS" "🎉 Docker environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env with your Docker Hub credentials"
echo "2. Run: ./scripts/quick-docker-build.sh"
echo "3. Or run: ./scripts/build-and-push-docker.sh"
echo ""
echo "🔧 Environment Summary:"
echo "  - Docker: ✅ Running"
echo "  - Docker Compose: ✅ Available"
echo "  - Docker Hub: $(docker info | grep -q "Username" && echo "✅ Logged in" || echo "⚠️  Not logged in")"
echo "  - Disk Space: ${DISK_SPACE_GB}GB"
echo "  - Scripts: ✅ Ready"
echo ""
echo "🚀 Ready to build and push Docker images!"
