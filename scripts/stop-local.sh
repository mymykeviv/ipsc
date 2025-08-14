#!/bin/bash

# Stop Local Development Environment Script

set -e

echo "🛑 Stopping Local Development Environment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop background processes
if [ -f .dev-pids ]; then
    print_status "Stopping background processes..."
    source .dev-pids
    
    if [ ! -z "$BACKEND_PID" ]; then
        print_status "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || print_warning "Backend process not found"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        print_status "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || print_warning "Frontend process not found"
    fi
    
    # Remove PID file
    rm -f .dev-pids
    print_success "Background processes stopped"
else
    print_warning "No PID file found. Processes may already be stopped."
fi

# Stop Docker containers
print_status "Stopping Docker containers..."

# Stop MailHog
if docker ps -q -f name=cashflow-mailhog-dev | grep -q .; then
    docker stop cashflow-mailhog-dev
    docker rm cashflow-mailhog-dev
    print_success "MailHog stopped and removed"
else
    print_warning "MailHog container not found"
fi

# Stop PostgreSQL if it was started by Docker
if docker ps -q -f name=cashflow-postgres-dev | grep -q .; then
    docker stop cashflow-postgres-dev
    docker rm cashflow-postgres-dev
    print_success "PostgreSQL stopped and removed"
else
    print_warning "PostgreSQL container not found"
fi

# Kill any remaining Node.js processes on port 5173
if lsof -ti:5173 > /dev/null 2>&1; then
    print_status "Killing processes on port 5173..."
    lsof -ti:5173 | xargs kill -9
    print_success "Port 5173 cleared"
fi

# Kill any remaining Python processes on port 8000
if lsof -ti:8000 > /dev/null 2>&1; then
    print_status "Killing processes on port 8000..."
    lsof -ti:8000 | xargs kill -9
    print_success "Port 8000 cleared"
fi

echo ""
print_success "Local development environment stopped successfully!"
echo ""
echo "📝 All services have been stopped:"
echo "   - Frontend (port 5173)"
echo "   - Backend (port 8000)"
echo "   - MailHog (port 8025)"
echo "   - PostgreSQL (port 5432)"
echo ""
echo "🚀 To start again, run: ./scripts/local-dev.sh"
