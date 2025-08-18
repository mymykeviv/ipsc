#!/bin/bash

# Development Deployment Script
# Quick deployment for development environment
# Usage: ./scripts/deploy-dev.sh [--skip-tests]

set -e

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

echo "🚀 Starting Development Deployment..."

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = false ]; then
        echo "🧪 Running tests..."
        
        # Backend tests
        echo "Running backend tests..."
        cd backend
        python3 -m pytest tests/ -v --tb=short || {
            echo "❌ Backend tests failed"
            exit 1
        }
        cd ..
        
        # Frontend tests
        echo "Running frontend tests..."
        cd frontend
        npm test -- --run --reporter=verbose || {
            echo "❌ Frontend tests failed"
            exit 1
        }
        cd ..
        
        echo "✅ All tests passed"
    else
        echo "⏭️ Skipping tests (--skip-tests flag used)"
    fi
}

# Run tests before deployment
run_tests

# Stop existing containers
docker-compose down 2>/dev/null || true

# Build and start services
docker-compose up -d --build

# Wait for services
sleep 5

# Check health
echo "Checking service health..."
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

echo "🎉 Development deployment completed!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
