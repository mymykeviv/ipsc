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

# Warn if uvicorn is missing
python3 - <<'PY' >/dev/null 2>&1 || true
import importlib,sys
sys.exit(0 if importlib.util.find_spec('uvicorn') else 1)
PY
if [ $? -ne 0 ]; then
  echo "[WARN] 'uvicorn' package not found. Install with: pip install 'uvicorn[standard]' fastapi"
fi

# Start backend
( cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload ) &
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