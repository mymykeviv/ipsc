#!/usr/bin/env bash
set -euo pipefail

# dev-unix.sh - Start local development for backend (FastAPI) and frontend (Vite)
# Usage: bash scripts/dev-unix.sh
# Requires: python3 (with uvicorn, fastapi), node/npm

# Move to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Read backend port from config/ports.json; default to 8000
if command -v jq >/dev/null 2>&1; then
  BACKEND_PORT=$(jq -r '.backend.port // 8000' config/ports.json 2>/dev/null || echo 8000)
else
  BACKEND_PORT=$(python3 - <<'PY'
import json,sys
try:
  with open('config/ports.json') as f:
    j=json.load(f)
    print(j.get('backend',{}).get('port',8000))
except Exception:
  print(8000)
PY
  )
fi

FRONTEND_DEV_PORT=5173

# Checks
command -v python3 >/dev/null 2>&1 || { echo "[ERROR] python3 not found"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "[ERROR] npm not found"; exit 1; }

# Ensure backend (Python) virtualenv and dependencies are installed
VENV_DIR="$PWD/backend/.venv"
PYTHON_BIN="$VENV_DIR/bin/python"
if [ ! -x "$PYTHON_BIN" ]; then
  echo "[INFO] Creating Python virtual environment at $VENV_DIR ..."
  python3 -m venv "$VENV_DIR"
fi

echo "[INFO] Ensuring backend Python dependencies are installed..."
"$PYTHON_BIN" -m pip install --upgrade pip >/dev/null 2>&1 || true
"$PYTHON_BIN" -m pip install -r backend/requirements.txt

# Ensure frontend (Node) dependencies are installed
(
  cd frontend
  echo "[INFO] Checking frontend Node dependencies..."
  if [ ! -d node_modules ]; then
    echo "[INFO] Installing frontend dependencies..."
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
  else
    echo "[INFO] node_modules exists. Skipping install."
  fi
)

# Start backend (use venv python)
( cd backend && "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload ) &
BACKEND_PID=$!

# Start frontend
( cd frontend && npm run dev -- --port "$FRONTEND_DEV_PORT" ) &
FRONTEND_PID=$!

trap 'echo "Stopping..."; kill $FRONTEND_PID 2>/dev/null || true; kill $BACKEND_PID 2>/dev/null || true; wait' INT TERM

cat <<EOF
===============================================
IPSC Dev Started
Frontend: http://localhost:${FRONTEND_DEV_PORT}
Backend API: http://localhost:${BACKEND_PORT}
Press Ctrl+C to stop both.
===============================================
EOF

wait