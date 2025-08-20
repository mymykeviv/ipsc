#!/bin/bash

# Stop Local Development Environment Script for IPSC Application

echo "🛑 Stopping IPSC Local Development Environment..."

# Kill processes by PID if available
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill $BACKEND_PID 2>/dev/null; then
        echo "✅ Backend stopped (PID: $BACKEND_PID)"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill $FRONTEND_PID 2>/dev/null; then
        echo "✅ Frontend stopped (PID: $FRONTEND_PID)"
    fi
    rm -f .frontend.pid
fi

# Kill any remaining uvicorn and npm processes
pkill -f "uvicorn app.main:app" 2>/dev/null && echo "✅ Additional uvicorn processes stopped"
pkill -f "npm run dev" 2>/dev/null && echo "✅ Additional npm processes stopped"

echo "🏁 Local development environment stopped!"