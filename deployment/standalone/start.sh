#!/bin/bash

echo ""
echo "========================================"
echo "   ProfitPath - Starting Application..."
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ ERROR: Docker is not running!"
  echo "   Please start Docker and try again."
  echo ""
  exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "❌ ERROR: docker-compose is not installed!"
  echo "   Please install docker-compose and try again."
  echo ""
  exit 1
fi

echo "✅ Docker is running. Starting services..."
echo ""

# Pull latest images
echo "📥 Downloading latest application files..."
docker-compose pull

# Start services
echo "🚀 Starting ProfitPath services..."
docker-compose up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to start (this may take a few minutes)..."
sleep 30

# Check if services are running
echo ""
echo "🔍 Checking if services are ready..."

# Try to check backend health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
  echo "✅ Backend is ready"
else
  echo "⚠️  Backend is still starting up..."
fi

# Try to check frontend
if curl -f http://localhost:80 > /dev/null 2>&1; then
  echo "✅ Frontend is ready"
else
  echo "⚠️  Frontend is still starting up..."
fi

echo ""
echo "========================================"
echo "   🎉 ProfitPath is starting up!"
echo "========================================"
echo ""
echo "📱 Open your web browser and go to:"
echo "   http://localhost"
echo ""
echo "🔧 Backend API: http://localhost:8000"
echo "🗄️  Database: localhost:5432"
echo ""
echo "💡 Default login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⏳ If the page doesn't load immediately,"
echo "   wait a few more minutes for all services"
echo "   to fully start up."
echo ""
echo "========================================"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop: docker-compose down"
echo "  Restart: docker-compose restart"
echo ""
