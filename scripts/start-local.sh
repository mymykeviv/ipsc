#!/usr/bin/env bash
set -euo pipefail

# Local development starter WITHOUT Docker
# - Backend: FastAPI via uvicorn on :8000
# - Frontend: Vite dev server on :5173
# Requirements:
#   - Python 3.10+
#   - Node 18+ (20 LTS recommended)
#   - npm installed
#   - PostgreSQL running locally (optional for prod mode, SQLite for dev)
# Usage:
#   ./scripts/start-local.sh [dev|prod]
#   ./scripts/start-local.sh          # defaults to dev mode
#   ./scripts/start-local.sh dev      # development mode (SQLite, debug on)
#   ./scripts/start-local.sh prod     # production mode (PostgreSQL preferred)

# Parse command line arguments
MODE="${1:-dev}"  # Default to dev mode

if [[ "$MODE" != "dev" && "$MODE" != "prod" ]]; then
    echo "Usage: $0 [dev|prod]"
    echo "  dev  - Development mode (SQLite, debug enabled, hot reload)"
    echo "  prod - Production mode (PostgreSQL preferred, optimized settings)"
    exit 1
fi

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PIDFILE="$ROOT_DIR/.local-$MODE.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; }

# Cleanup function
cleanup() {
    if [[ -f "$PIDFILE" ]]; then
        log "Cleaning up processes..."
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PIDFILE"
        rm -f "$PIDFILE"
    fi
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Check if already running
if [[ -f "$PIDFILE" ]]; then
    err "Local development ($MODE mode) appears to be already running. Stop it first with: ./scripts/stop-local.sh $MODE"
    exit 1
fi

# --- Platform Detection ---
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    PLATFORM="windows"
    PYTHON_CMD="python"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
    PYTHON_CMD="python3"
else
    PLATFORM="linux"
    PYTHON_CMD="python3"
fi

log "Detected platform: $PLATFORM"
log "Running in $MODE mode"

# --- Dependency Checks ---
command -v "$PYTHON_CMD" >/dev/null 2>&1 || { err "$PYTHON_CMD not found"; exit 1; }
command -v npm >/dev/null 2>&1 || { err "npm not found"; exit 1; }

# Check Python version
PYTHON_VERSION=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
if [[ "$(echo "$PYTHON_VERSION < 3.10" | bc -l 2>/dev/null || echo 1)" == "1" ]]; then
    warn "Python version $PYTHON_VERSION detected. Python 3.10+ recommended."
fi

# Check Node version
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' || echo "0.0.0")
if [[ "$(echo "$NODE_VERSION" | cut -d. -f1)" -lt 18 ]]; then
    warn "Node version $NODE_VERSION detected. Node 18+ recommended."
fi

# --- Backend Setup ---
log "Setting up backend..."
cd "$BACKEND_DIR"
  
  # Check for virtual environment
  if [[ ! -d "venv" ]] && [[ ! -d ".venv" ]] && [[ -z "${VIRTUAL_ENV:-}" ]]; then
    log "Creating Python virtual environment..."
    "$PYTHON_CMD" -m venv venv
    if [[ "$PLATFORM" == "windows" ]]; then
      source venv/Scripts/activate
    else
      source venv/bin/activate
    fi
  elif [[ -d "venv" ]]; then
    log "Activating existing virtual environment..."
    if [[ "$PLATFORM" == "windows" ]]; then
      source venv/Scripts/activate
    else
      source venv/bin/activate
    fi
  elif [[ -d ".venv" ]]; then
    log "Activating existing virtual environment..."
    if [[ "$PLATFORM" == "windows" ]]; then
      source .venv/Scripts/activate
    else
      source .venv/bin/activate
    fi
  fi
  
  # Install dependencies
  if ! python -c "import uvicorn" >/dev/null 2>&1; then
    log "Installing backend dependencies..."
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
  fi
  
  # Environment variables based on mode
  if [[ "$MODE" == "dev" ]]; then
    export ENVIRONMENT=development
    export LOG_LEVEL=DEBUG
    export DEBUG=true
    export RELOAD=true
    
    # Development mode: prefer SQLite for simplicity
    export DATABASE_URL=${DATABASE_URL:-"sqlite:///./profitpath.db"}
    export DATABASE_TYPE=sqlite
    log "Development mode: Using SQLite database"
  else
    export ENVIRONMENT=production
    export LOG_LEVEL=INFO
    export DEBUG=false
    export RELOAD=false
    
    # Production mode: default to SQLite for consistency
    export DATABASE_URL=${DATABASE_URL:-"sqlite:///./profitpath.db"}
    export DATABASE_TYPE=sqlite
    log "Production mode: Using SQLite database"
  fi
  
  # Run database migrations
  if command -v alembic >/dev/null 2>&1; then
    log "Running database migrations..."
    alembic upgrade head || warn "Migration failed, continuing..."
  fi
  
  log "Starting backend API on http://localhost:8000"
  if [[ "$MODE" == "dev" ]]; then
    # Development mode: enable reload, detailed logging
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug &
  else
    # Production mode: no reload, optimized settings
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info &
  fi
  BACKEND_PID=$!
  echo "$BACKEND_PID" >> "$PIDFILE"
  ok "Backend started with PID $BACKEND_PID ($MODE mode)"

# --- Frontend Setup ---
log "Setting up frontend..."
cd "$FRONTEND_DIR"
  
  # Install dependencies
  if [[ ! -d "node_modules" ]] || [[ ! -f "node_modules/.package-lock.json" ]]; then
    log "Installing frontend dependencies..."
    if [[ "$MODE" == "dev" ]]; then
      npm ci --no-audit --no-fund || npm install --no-audit --no-fund
    else
      npm ci --only=production --no-audit --no-fund || npm install --only=production --no-audit --no-fund
    fi
  fi
  
  # Force Rollup to use JS implementation to avoid native binding issues
  export ROLLUP_SKIP_NODEJS_NATIVE=true
  
  # Set environment variables for frontend
  if [[ "$MODE" == "dev" ]]; then
    export NODE_ENV=development
    export VITE_API_URL=http://localhost:8000
    log "Starting frontend dev server on http://localhost:5173"
    npm run dev -- --host 0.0.0.0 --port 5173 &
  else
    export NODE_ENV=production
    export VITE_API_URL=http://localhost:8000
    log "Starting frontend in production mode on http://localhost:5173"
    # For production mode, we'll still use dev server but with production env
    npm run dev -- --host 0.0.0.0 --port 5173 --mode production &
  fi
  
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" >> "$PIDFILE"
  ok "Frontend started with PID $FRONTEND_PID ($MODE mode)"

# Wait a moment for services to start
sleep 2

# Display status
log "Local development environment started in $MODE mode!"
ok "Backend API: http://localhost:8000"
ok "Frontend App: http://localhost:5173"
if [[ "$MODE" == "dev" ]]; then
  log "Development features: Hot reload enabled, SQLite database, debug logging"
else
  log "Production features: Optimized settings, PostgreSQL preferred, info logging"
fi
log "To stop the services, run: ./scripts/stop-local.sh $MODE"
log "Press Ctrl+C to stop all services"

# Keep script running to maintain processes
# Wait for any background process
wait
