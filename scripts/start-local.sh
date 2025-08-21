#!/bin/bash

# Local Development Startup Script for ProfitPath Application (without Docker)
# This script sets up and starts the application for local development using SQLite

set -e

echo "🚀 Starting ProfitPath Local Development Environment..."

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
if [[ "$PYTHON_VERSION" < "3.11" ]]; then
    echo "❌ Python 3.11 or higher is required. Current version: $(python3 --version)"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Please run 'python3 -m venv .venv' first"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source .venv/bin/activate

# Install/update backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
echo "⚠️  This may take a few minutes on first run..."
if ! pip install -q -r requirements.txt --only-binary=all; then
    echo "⚠️  Pre-built wheel installation failed, trying standard approach..."
    if ! pip install -q -r requirements.txt; then
        echo "⚠️  Standard installation failed, trying alternative approach..."
        echo "📦 Upgrading pip, setuptools, and wheel..."
        pip install --upgrade pip setuptools wheel
        
        echo "📦 Trying installation with --no-cache-dir..."
        if ! pip install -q -r requirements.txt --no-cache-dir; then
            echo "❌ Failed to install backend dependencies"
            echo "💡 This might be due to Python 3.13 compatibility issues"
            echo "💡 Try using Python 3.11 or 3.12 instead"
            echo "💡 Or manually install: pip install pandas>=2.2.0"
            exit 1
        fi
    fi
fi

# Run database migrations
echo "🗄️  Running database migrations..."
python3 migrate.py upgrade

# Start backend in background
echo "🚀 Starting backend service..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level info &
BACKEND_PID=$!

# Return to root directory
cd ..

# Install/update frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install -q

# Start frontend in background
echo "🚀 Starting frontend service..."
npm run dev &
FRONTEND_PID=$!

# Return to root directory
cd ..

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Test backend health
echo "🏥 Testing backend health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Test frontend
echo "🌐 Testing frontend..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running at http://localhost:5173"
else
    echo "❌ Frontend failed to start"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 ProfitPath Application is running successfully!"
echo ""
echo "📊 Backend API: http://localhost:8000"
echo "🌐 Frontend UI: http://localhost:5173"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "💡 To stop the application, run: ./scripts/stop-local.sh"
echo ""

# Save PIDs for stop script
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Keep script running to maintain foreground process
wait $BACKEND_PID $FRONTEND_PID
