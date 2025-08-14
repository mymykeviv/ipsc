#!/bin/bash

# Cashflow Local Development Script
# Automatically handles file cleanup and ensures TypeScript files are used

set -e

echo "🚀 Cashflow Local Development Setup"
echo "==================================="

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
find ./frontend -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find ./frontend -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
print_success "Old compiled files cleaned"

# Step 2: Check if Python virtual environment exists
if [ ! -d ".venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv .venv
    print_success "Virtual environment created"
fi

# Step 3: Activate virtual environment and install dependencies
print_status "Installing Python dependencies..."
source .venv/bin/activate
pip install -r backend/requirements.txt
print_success "Python dependencies installed"

# Step 4: Install Node.js dependencies
print_status "Installing Node.js dependencies..."
cd frontend
npm install
cd ..
print_success "Node.js dependencies installed"

# Step 5: Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local file..."
    cat > .env.local << EOF
DATABASE_URL=sqlite:///backend/cashflow.db
SECRET_KEY=dev-secret-key
DEBUG=true
LOG_LEVEL=DEBUG
EOF
    print_success ".env.local created"
fi

# Step 6: Start backend
print_status "Starting backend server..."
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..
print_success "Backend started (PID: $BACKEND_PID)"

# Step 7: Wait for backend to be ready
print_status "Waiting for backend to be ready..."
sleep 5

# Step 8: Test backend
if curl -s http://localhost:8000/health > /dev/null; then
    print_success "Backend is accessible"
else
    print_error "Backend is not accessible"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Step 9: Start frontend
print_status "Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
print_success "Frontend started (PID: $FRONTEND_PID)"

# Step 10: Wait for frontend to be ready
print_status "Waiting for frontend to be ready..."
sleep 10

# Step 11: Test frontend
if curl -s http://localhost:5173 > /dev/null; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Step 12: Test API proxy
if curl -s -X POST http://localhost:5173/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' > /dev/null; then
    print_success "API proxy is working"
else
    print_error "API proxy is not working"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
print_success "🎉 Local development setup completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🔑 Login Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📝 Test Forms:"
echo "   Invoice Form: http://localhost:5173/invoices/add"
echo "   Product Form: http://localhost:5173/products/add"
echo ""
echo "🛑 To stop the servers, run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
print_warning "💡 Remember to clear your browser cache (Ctrl+F5 / Cmd+Shift+R) to see the latest changes!"

# Keep script running and handle cleanup on exit
trap "echo ''; print_status 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; print_success 'Servers stopped'; exit 0" INT TERM

# Wait for user to stop
echo ""
print_status "Press Ctrl+C to stop the servers..."
wait
