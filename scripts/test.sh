#!/bin/bash

# Simple Test Script
# Runs all tests for the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running Tests...${NC}"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${RED}Error: Virtual environment not found. Please create one with: python3 -m venv .venv${NC}"
    exit 1
fi

# Backend tests
echo -e "${BLUE}Running backend tests...${NC}"
cd backend
source ../.venv/bin/activate
python -m pytest tests/ -v --tb=short || {
    echo -e "${RED}❌ Backend tests failed${NC}"
    exit 1
}
deactivate
cd ..

# Frontend tests
echo -e "${BLUE}Running frontend tests...${NC}"
cd frontend
# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi
npm test -- --run --reporter=verbose || {
    echo -e "${RED}❌ Frontend tests failed${NC}"
    exit 1
}
cd ..

echo -e "${GREEN}✅ All tests completed!${NC}"
