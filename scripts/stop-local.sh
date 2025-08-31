#!/usr/bin/env bash
set -euo pipefail

# Stop local development processes
# Usage: ./scripts/stop-local.sh [dev|prod]
#   ./scripts/stop-local.sh          # stops both dev and prod if running
#   ./scripts/stop-local.sh dev      # stops only dev mode
#   ./scripts/stop-local.sh prod     # stops only prod mode

# Parse command line arguments
MODE="${1:-}"

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

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

# Function to stop processes from a PID file
stop_processes_from_pidfile() {
    local pidfile="$1"
    local mode_name="$2"
    
    if [[ ! -f "$pidfile" ]]; then
        return 1
    fi
    
    log "Stopping $mode_name processes..."
    local stopped_count=0
    
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
            
            stopped_count=$((stopped_count + 1))
        fi
    done < "$pidfile"
    
    # Remove PID file
    rm -f "$pidfile"
    
    if [[ $stopped_count -gt 0 ]]; then
        ok "Stopped $stopped_count $mode_name processes"
    else
        warn "No running $mode_name processes found"
    fi
    
    return 0
}

# Function to perform cleanup of remaining processes
perform_cleanup() {
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
}

# Main logic
if [[ -n "$MODE" ]]; then
    # Stop specific mode
    if [[ "$MODE" != "dev" && "$MODE" != "prod" ]]; then
        err "Invalid mode: $MODE. Use 'dev' or 'prod'"
        exit 1
    fi
    
    PIDFILE="$ROOT_DIR/.local-$MODE.pid"
    
    if ! stop_processes_from_pidfile "$PIDFILE" "$MODE"; then
        warn "No $MODE PID file found. $MODE mode may not be running."
    fi
else
    # Stop all modes
    DEV_PIDFILE="$ROOT_DIR/.local-dev.pid"
    PROD_PIDFILE="$ROOT_DIR/.local-prod.pid"
    
    local any_stopped=false
    
    if stop_processes_from_pidfile "$DEV_PIDFILE" "development"; then
        any_stopped=true
    fi
    
    if stop_processes_from_pidfile "$PROD_PIDFILE" "production"; then
        any_stopped=true
    fi
    
    if [[ "$any_stopped" == "false" ]]; then
        warn "No PID files found. Local development may not be running."
        log "Attempting to stop any remaining processes..."
    fi
fi

# Always perform cleanup
perform_cleanup

ok "Local development environment stopped"
if [[ -n "$MODE" ]]; then
    log "You can restart $MODE mode with: ./scripts/start-local.sh $MODE"
else
    log "You can restart with: ./scripts/start-local.sh [dev|prod]"
fi