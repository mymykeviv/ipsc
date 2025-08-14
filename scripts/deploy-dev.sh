#!/bin/bash

# Cashflow Development Deployment Script
# Automatically handles file cleanup and container rebuilding

set -e

echo "🚀 Cashflow Development Deployment"
echo "=================================="

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

# Step 1: Clean up old compiled files
print_status "Cleaning up old compiled files..."
find ./frontend -name "*.js" -not -path "./frontend/node_modules/*" -delete 2>/dev/null || true
find ./frontend -name "*.js.map" -not -path "./frontend/node_modules/*" -delete 2>/dev/null || true
print_success "Old compiled files cleaned"

# Step 2: Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans
print_success "Containers stopped"

# Step 3: Clean Docker cache (optional)
if [[ "$1" == "--clean-cache" ]]; then
    print_status "Cleaning Docker cache..."
    docker system prune -f
    print_success "Docker cache cleaned"
fi

# Step 4: Rebuild and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.dev.yml up -d --build

# Step 5: Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Step 6: Verify services
print_status "Verifying services..."

# Check if containers are running
if docker ps | grep -q "cashflow-frontend-dev"; then
    print_success "Frontend container is running"
else
    print_error "Frontend container failed to start"
    exit 1
fi

if docker ps | grep -q "cashflow-backend-dev"; then
    print_success "Backend container is running"
else
    print_error "Backend container failed to start"
    exit 1
fi

# Test frontend
if curl -s http://localhost:5173 > /dev/null; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    exit 1
fi

# Test backend
if curl -s http://localhost:8000/health > /dev/null; then
    print_success "Backend is accessible"
else
    print_error "Backend is not accessible"
    exit 1
fi

# Test API proxy
if curl -s -X POST http://localhost:5173/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' > /dev/null; then
    print_success "API proxy is working"
else
    print_error "API proxy is not working"
    exit 1
fi

echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   MailHog:  http://localhost:8025"
echo ""
echo "🔑 Login Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📝 Test Forms:"
echo "   Invoice Form: http://localhost:5173/invoices/add"
echo "   Product Form: http://localhost:5173/products/add"
echo ""
print_warning "💡 Remember to clear your browser cache (Ctrl+F5 / Cmd+Shift+R) to see the latest changes!"
