#!/bin/bash

echo ""
echo "========================================"
echo "   ProfitPath - Deployment Test"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if docker-compose is running
echo "🔍 Checking if services are running..."
if ! docker-compose ps | grep -q "Up"; then
    print_error "No services are running. Please start the application first."
    exit 1
fi

print_status "Services are running"

# Test database connection
echo ""
echo "🗄️  Testing database connection..."
if docker-compose exec -T database pg_isready -U profitpath > /dev/null 2>&1; then
    print_status "Database is accessible"
else
    print_error "Database is not accessible"
fi

# Test backend API
echo ""
echo "🔧 Testing backend API..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    print_status "Backend API is responding"
else
    print_error "Backend API is not responding"
fi

# Test frontend via nginx
echo ""
echo "📱 Testing frontend application..."
if curl -f http://localhost > /dev/null 2>&1; then
    print_status "Frontend is accessible"
else
    print_error "Frontend is not accessible"
fi

# Test nginx health endpoint
echo ""
echo "🌐 Testing nginx reverse proxy..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "Nginx is working correctly"
else
    print_error "Nginx is not working correctly"
fi

# Test MailHog
echo ""
echo "📧 Testing MailHog email service..."
if curl -f http://localhost:8025 > /dev/null 2>&1; then
    print_status "MailHog is accessible"
else
    print_error "MailHog is not accessible"
fi

# Test API endpoints
echo ""
echo "🔌 Testing API endpoints..."

# Test authentication endpoint
if curl -f http://localhost/api/auth/login > /dev/null 2>&1; then
    print_status "Authentication endpoint is working"
else
    print_warning "Authentication endpoint may not be working"
fi

# Test health endpoint with response
echo ""
echo "📊 Health check details:"
HEALTH_RESPONSE=$(curl -s http://localhost/api/health 2>/dev/null)
if [ ! -z "$HEALTH_RESPONSE" ]; then
    echo "   Backend health: $HEALTH_RESPONSE"
else
    print_warning "Could not get health response"
fi

# Check container status
echo ""
echo "🐳 Container status:"
docker-compose ps

# Check resource usage
echo ""
echo "💾 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "========================================"
echo "   🎉 Deployment test completed!"
echo "========================================"
echo ""
echo "📱 Access your application at:"
echo "   http://localhost"
echo ""
echo "📧 Access MailHog at:"
echo "   http://localhost:8025"
echo ""
echo "🔧 If you see any errors above, check the logs:"
echo "   docker-compose logs -f"
echo ""
