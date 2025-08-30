#!/usr/bin/env bash
set -euo pipefail

# Stop local development processes
# Usage: ./scripts/stop-local.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
PIDFILE="$ROOT_DIR/.local-dev.pid"

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

if [[ ! -f "$PIDFILE" ]]; then
    warn "No PID file found. Local development may not be running."
    # Try to kill common processes anyway
    log "Attempting to stop any remaining processes..."
    
    # Kill uvicorn processes
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
    
    # Kill npm/vite processes
    pkill -f "npm.*run.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    # Kill node processes running on ports 8000 or 5173
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
        lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true
    elif command -v netstat >/dev/null 2>&1; then
        # Windows/alternative approach
        netstat -ano | grep ":8000 " | awk '{print $5}' | xargs -r taskkill //PID 2>/dev/null || true
        netstat -ano | grep ":5173 " | awk '{print $5}' | xargs -r taskkill //PID 2>/dev/null || true
    fi
    
    ok "Cleanup attempt completed"
    exit 0
fi

log "Stopping local development processes..."

# Read PIDs and stop processes
STOPPED_COUNT=0
while read -r pid; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        log "Stopping process $pid..."
        kill "$pid" 2>/dev/null || true
        
        # Wait a moment for graceful shutdown
        sleep 1
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            warn "Force killing process $pid..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    fi
done < "$PIDFILE"

# Remove PID file
rm -f "$PIDFILE"

if [[ $STOPPED_COUNT -gt 0 ]]; then
    ok "Stopped $STOPPED_COUNT processes"
else
    warn "No running processes found"
fi

# Additional cleanup for any remaining processes
log "Performing additional cleanup..."

# Kill any remaining uvicorn processes
pkill -f "uvicorn.*app.main:app" 2>/dev/null || true

# Kill any remaining npm/vite processes
pkill -f "npm.*run.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Free up ports 8000 and 5173
if command -v lsof >/dev/null 2>&1; then
    lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true
elif command -v netstat >/dev/null 2>&1; then
    # Windows/alternative approach
    netstat -ano | grep ":8000 " | awk '{print $5}' | xargs -r taskkill //PID 2>/dev/null || true
    netstat -ano | grep ":5173 " | awk '{print $5}' | xargs -r taskkill //PID 2>/dev/null || true
fi

ok "Local development environment stopped"
log "You can restart with: ./scripts/start-local.sh"