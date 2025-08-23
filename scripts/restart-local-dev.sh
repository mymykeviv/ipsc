#!/bin/bash

# Restart Local Development Environment Script for ProfitPath
# This script stops the current environment and starts it again

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

echo "🔄 Restarting Local Development Environment"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "backend/app/main.py" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Stop current environment
print_status "Stopping current environment..."
if [ -f "scripts/stop-local-dev.sh" ]; then
    ./scripts/stop-local-dev.sh
    print_success "Current environment stopped"
else
    print_warning "Stop script not found, attempting manual cleanup..."
    # Manual cleanup
    docker stop profitpath-postgres-dev profitpath-mailhog-dev 2>/dev/null || true
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    rm -f .dev-pids .backend.pid .frontend.pid 2>/dev/null || true
fi

# Wait a moment for cleanup to complete
print_status "Waiting for cleanup to complete..."
sleep 3

# Start environment again
print_status "Starting environment again..."
if [ -f "scripts/local-dev.sh" ]; then
    ./scripts/local-dev.sh
else
    print_error "Start script not found: scripts/local-dev.sh"
    exit 1
fi

