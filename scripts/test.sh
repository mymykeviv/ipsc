#!/bin/bash

# Simple Test Script
# Runs all tests for the application

set -e

echo "🧪 Running Tests..."

# Backend tests
echo "Running backend tests..."
cd backend
python3 -m pytest tests/ -v --tb=short
cd ..

# Frontend tests
echo "Running frontend tests..."
cd frontend
npm test -- --run --reporter=verbose
cd ..

echo "✅ All tests completed!"
