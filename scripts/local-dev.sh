#!/bin/bash

# Local Development Script - Maximum Debugging Mode
# This script runs all services locally for fast development and testing

set -e

echo "🚀 Starting Local Development Environment (Maximum Debugging Mode)"
echo "================================================================"

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+"
        exit 1
    fi
    
    # Check SQLite (not needed for SQLite, but keeping for compatibility)
    if ! command -v sqlite3 &> /dev/null; then
        print_warning "SQLite3 not found, but it's usually included with Python."
    fi
    
    print_success "Dependencies check completed"
}

# Setup Python virtual environment
setup_python_env() {
    print_status "Setting up Python virtual environment..."
    
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
        print_success "Created virtual environment"
    fi
    
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r backend/requirements.txt
    print_success "Python dependencies installed"
}

# Create environment file for local development
create_env_file() {
    print_status "Creating local environment file..."
    
    cat > .env.local << EOF
# Local Development Environment Variables
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/profitpath
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=true
LOG_LEVEL=DEBUG

# Email settings for MailHog
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=no-reply@localhost
SMTP_ENABLED=false
EOF
    
    print_success "Environment file created"
}

# Setup Node.js dependencies
setup_node_env() {
    print_status "Setting up Node.js dependencies..."
    
    # Clean up old compiled files first
    print_status "Cleaning up old compiled files..."
    find ./frontend -name "*.js" -not -path "./frontend/node_modules/*" -delete 2>/dev/null || true
    find ./frontend -name "*.js.map" -not -path "./frontend/node_modules/*" -delete 2>/dev/null || true
    find ./frontend -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find ./frontend -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    print_success "Old compiled files cleaned"
    
    cd frontend
    npm install
    cd ..
    print_success "Node.js dependencies installed"
}

# Start MailHog for email testing
# Start PostgreSQL database
start_postgresql() {
    print_status "Starting PostgreSQL database..."
    
    # Remove existing container if it exists
    docker rm -f profitpath-postgres-dev 2>/dev/null || true
    
    docker run -d \
        --name profitpath-postgres-dev \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=profitpath \
        -p 5432:5432 \
        postgres:16-alpine
    
    print_success "PostgreSQL started on localhost:5432"
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec profitpath-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "PostgreSQL health check failed, but continuing..."
            break
        fi
        sleep 1
    done
}
start_mailhog() {
    print_status "Starting MailHog for email testing..."
    
    # Remove existing container if it exists
    docker rm -f profitpath-mailhog-dev 2>/dev/null || true
    
    docker run -d \
        --name profitpath-mailhog-dev \
        -p 1025:1025 \
        -p 8025:8025 \
        mailhog/mailhog:v1.0.1
    
    print_success "MailHog started on http://localhost:8025"
}

# Start Backend in development mode
start_backend() {
    print_status "Starting Backend in development mode..."
    
    source .venv/bin/activate
    
    # Environment variables are loaded from .env.local file
    
    # SQLite database will be created automatically by SQLAlchemy
    print_status "PostgreSQL database will be created automatically"
    
    # Start backend with auto-reload
    # Set environment variables for development
    export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/profitpath"
    export SECRET_KEY="dev-secret-key-change-in-production"
    export DEBUG="true"
    export LOG_LEVEL="DEBUG"
    export ENVIRONMENT="development"
    export SECURITY_ENABLED="false"
    export MULTI_TENANT_ENABLED="false"
    export DATABASE_OPTIMIZATION_ENABLED="false"
    export PERFORMANCE_MONITORING_ENABLED="false"
    export SECURITY_MONITORING_ENABLED="false"
    cd backend
    # Run Alembic migrations to ensure DB schema is up to date
    alembic -c alembic.ini upgrade head
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug &
    BACKEND_PID=$!
    cd ..
    
    print_success "Backend started on http://localhost:8000 (PID: $BACKEND_PID)"
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Backend health check failed, but continuing..."
            break
        fi
        sleep 1
    done
}

# Start Frontend in development mode
start_frontend() {
    print_status "Starting Frontend in development mode..."
    
    cd frontend
    
    # Environment variables are loaded from .env.local file
    
    # Start frontend with hot reload
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Frontend started on http://localhost:5173 (PID: $FRONTEND_PID)"
}

# Create PID file for cleanup
create_pid_file() {
    echo "BACKEND_PID=$BACKEND_PID" > .dev-pids
    echo "FRONTEND_PID=$FRONTEND_PID" >> .dev-pids
    echo "MAILHOG_CONTAINER=profitpath-mailhog-dev" >> .dev-pids
    echo "POSTGRES_CONTAINER=profitpath-postgres-dev" >> .dev-pids
}

# Show status and URLs
show_status() {
    echo ""
    echo "🎉 Local Development Environment Started Successfully!"
    echo "====================================================="
    echo ""
    echo "📱 Frontend:     http://localhost:5173"
    echo "🔧 Backend API:  http://localhost:8000"
    echo "📧 MailHog:      http://localhost:8025"
    echo "🗄️  Database:     PostgreSQL (localhost:5432)"
    echo ""
    echo "🔍 Debug Features Enabled:"
    echo "   - Hot reload for frontend and backend"
    echo "   - Maximum logging and debugging"
    echo "   - Auto-restart on file changes"
    echo "   - Real-time error reporting"
    echo ""
    echo "📝 Useful Commands:"
    echo "   - View logs: tail -f logs/dev.log"
    echo "   - Stop services: ./scripts/stop-local-dev.sh"
    echo "   - Restart services: ./scripts/restart-local-dev.sh"
    echo ""
    echo "⚠️  Press Ctrl+C to stop all services"
}

# Cleanup function
cleanup() {
    print_status "Shutting down local development environment..."
    
    # Kill background processes
    if [ -f .dev-pids ]; then
        source .dev-pids
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        if [ ! -z "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID 2>/dev/null || true
        fi
    fi
    
    # Stop Docker containers
    docker stop profitpath-mailhog-dev 2>/dev/null || true
    docker stop profitpath-postgres-dev 2>/dev/null || true
    
    # Remove PID file
    rm -f .dev-pids
    
    print_success "Local development environment stopped"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo "Starting local development environment..."
    
    check_dependencies
    setup_python_env
    create_env_file
    setup_node_env
    start_postgresql
    start_mailhog
    start_backend
    start_frontend
    create_pid_file
    show_status
    
    # Wait for user to stop
    wait
}

# Run main function
main "$@"
