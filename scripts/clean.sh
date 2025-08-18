#!/bin/bash

# Simple Cleanup Script
# Cleans up containers, images, and volumes

set -e

echo "🧹 Cleaning up..."

# Stop and remove containers
docker-compose down --volumes --remove-orphans 2>/dev/null || true

# Remove unused images
docker system prune -f

# Clean node modules (optional)
if [[ "$1" == "--deep" ]]; then
    echo "Deep cleaning..."
    rm -rf frontend/node_modules
    rm -rf frontend/dist
    rm -rf backend/__pycache__
    rm -rf backend/app/__pycache__
fi

echo "✅ Cleanup completed!"
