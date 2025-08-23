#!/bin/bash

# Stop Local Development Environment Script for ProfitPath
# This script stops all services started by local-dev.sh

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

echo "🛑 Stopping Local Development Environment"
echo "========================================"

# Check if PID file exists
if [ ! -f ".dev-pids" ]; then
    print_warning "No PID file found. Services may not be running."
    print_status "Attempting to stop any running services..."
else
    print_status "Reading process information from PID file..."
    source .dev-pids
fi

# Stop background processes
print_status "Stopping background processes..."

# Stop backend process
if [ ! -z "$BACKEND_PID" ]; then
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_status "Stopping backend process (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_warning "Backend process still running, force killing..."
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        print_success "Backend process stopped"
    else
        print_warning "Backend process (PID: $BACKEND_PID) not running"
    fi
else
    print_warning "No backend PID found"
fi

# Stop frontend process
if [ ! -z "$FRONTEND_PID" ]; then
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        print_status "Stopping frontend process (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 2
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_warning "Frontend process still running, force killing..."
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        print_success "Frontend process stopped"
    else
        print_warning "Frontend process (PID: $FRONTEND_PID) not running"
    fi
else
    print_warning "No frontend PID found"
fi

# Stop Docker containers
print_status "Stopping Docker containers..."

# Stop MailHog container
if [ ! -z "$MAILHOG_CONTAINER" ]; then
    if docker ps -q -f name=$MAILHOG_CONTAINER | grep -q .; then
        print_status "Stopping MailHog container ($MAILHOG_CONTAINER)..."
        docker stop $MAILHOG_CONTAINER 2>/dev/null || true
        print_success "MailHog container stopped"
    else
        print_warning "MailHog container ($MAILHOG_CONTAINER) not running"
    fi
else
    print_warning "No MailHog container name found"
fi

# Stop PostgreSQL container
if [ ! -z "$POSTGRES_CONTAINER" ]; then
    if docker ps -q -f name=$POSTGRES_CONTAINER | grep -q .; then
        print_status "Stopping PostgreSQL container ($POSTGRES_CONTAINER)..."
        docker stop $POSTGRES_CONTAINER 2>/dev/null || true
        print_success "PostgreSQL container stopped"
    else
        print_warning "PostgreSQL container ($POSTGRES_CONTAINER) not running"
    fi
else
    print_warning "No PostgreSQL container name found"
fi

# Additional cleanup - try to stop containers by name even if PID file is missing
if [ ! -f ".dev-pids" ]; then
    print_status "Performing additional cleanup..."
    
    # Stop any running containers with our naming convention
    if docker ps -q -f name=profitpath-mailhog-dev | grep -q .; then
        print_status "Stopping MailHog container (by name)..."
        docker stop profitpath-mailhog-dev 2>/dev/null || true
        print_success "MailHog container stopped"
    fi
    
    if docker ps -q -f name=profitpath-postgres-dev | grep -q .; then
        print_status "Stopping PostgreSQL container (by name)..."
        docker stop profitpath-postgres-dev 2>/dev/null || true
        print_success "PostgreSQL container stopped"
    fi
fi

# Kill any remaining processes that might be using our ports
print_status "Checking for processes using development ports..."

# Check port 8000 (backend)
PORT_8000_PID=$(lsof -ti:8000 2>/dev/null || true)
if [ ! -z "$PORT_8000_PID" ]; then
    print_warning "Found process using port 8000 (PID: $PORT_8000_PID)"
    kill $PORT_8000_PID 2>/dev/null || true
    print_success "Process on port 8000 stopped"
fi

# Check port 5173 (frontend)
PORT_5173_PID=$(lsof -ti:5173 2>/dev/null || true)
if [ ! -z "$PORT_5173_PID" ]; then
    print_warning "Found process using port 5173 (PID: $PORT_5173_PID)"
    kill $PORT_5173_PID 2>/dev/null || true
    print_success "Process on port 5173 stopped"
fi

# Check port 5432 (PostgreSQL)
PORT_5432_PID=$(lsof -ti:5432 2>/dev/null || true)
if [ ! -z "$PORT_5432_PID" ]; then
    print_warning "Found process using port 5432 (PID: $PORT_5432_PID)"
    kill $PORT_5432_PID 2>/dev/null || true
    print_success "Process on port 5432 stopped"
fi

# Clean up PID file
if [ -f ".dev-pids" ]; then
    print_status "Removing PID file..."
    rm -f .dev-pids
    print_success "PID file removed"
fi

# Clean up any temporary files
print_status "Cleaning up temporary files..."
rm -f .backend.pid .frontend.pid 2>/dev/null || true

# Final status check
print_status "Performing final status check..."

# Check if any of our services are still running
BACKEND_RUNNING=$(lsof -ti:8000 2>/dev/null || true)
FRONTEND_RUNNING=$(lsof -ti:5173 2>/dev/null || true)
POSTGRES_RUNNING=$(docker ps -q -f name=profitpath-postgres-dev 2>/dev/null || true)
MAILHOG_RUNNING=$(docker ps -q -f name=profitpath-mailhog-dev 2>/dev/null || true)

if [ -z "$BACKEND_RUNNING" ] && [ -z "$FRONTEND_RUNNING" ] && [ -z "$POSTGRES_RUNNING" ] && [ -z "$MAILHOG_RUNNING" ]; then
    print_success "All services stopped successfully!"
else
    print_warning "Some services may still be running:"
    [ ! -z "$BACKEND_RUNNING" ] && echo "  - Backend (port 8000): PID $BACKEND_RUNNING"
    [ ! -z "$FRONTEND_RUNNING" ] && echo "  - Frontend (port 5173): PID $FRONTEND_RUNNING"
    [ ! -z "$POSTGRES_RUNNING" ] && echo "  - PostgreSQL container: $POSTGRES_RUNNING"
    [ ! -z "$MAILHOG_RUNNING" ] && echo "  - MailHog container: $MAILHOG_RUNNING"
fi

echo ""
echo "🎉 Local Development Environment Stopped Successfully!"
echo "====================================================="
echo ""
echo "💡 To restart the environment, run: ./scripts/local-dev.sh"
echo "💡 To check running services: docker ps"
echo "💡 To check port usage: lsof -i :8000, lsof -i :5173, lsof -i :5432"
echo ""

