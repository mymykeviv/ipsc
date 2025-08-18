#!/bin/bash

# Development Deployment Script
# Quick deployment for development environment

set -e

echo "🚀 Starting Development Deployment..."

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
