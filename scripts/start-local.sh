#!/usr/bin/env bash
set -euo pipefail

# Local development starter WITHOUT Docker
# - Backend: FastAPI via uvicorn on :8000
# - Frontend: Vite dev server on :5173
# Requirements:
#   - Python 3.10+
#   - Node 18+ (20 LTS recommended)
#   - npm installed
# Usage:
#   ./scripts/start-local.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# --- Checks ---
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 not found"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm not found"; exit 1; }

# --- Backend ---
(
  cd "$BACKEND_DIR"
  echo "[backend] Starting API on http://localhost:8000"
  # Ensure DB is available or use a local .env pointing to your DB.
  export ENVIRONMENT=development
  export LOG_LEVEL=INFO
  export DEBUG=true
  export DATABASE_URL=${DATABASE_URL:-"postgresql+psycopg://postgres:postgres@localhost:5432/profitpath"}
  # Install deps if venv not active and uvicorn missing
  if ! python3 -c "import uvicorn" >/dev/null 2>&1; then
    echo "[backend] uvicorn not found. Installing minimal deps..."
    python3 -m pip install --upgrade pip >/dev/null
    python3 -m pip install uvicorn fastapi >/dev/null
  fi
  # Run alembic if available
  if command -v alembic >/dev/null 2>&1; then
    alembic upgrade head || true
  fi
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
)

# --- Frontend ---
(
  cd "$FRONTEND_DIR"
  echo "[frontend] Installing deps (if needed) and starting Vite on http://localhost:5173"
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
  npm run dev -- --host 0.0.0.0 --port 5173
)
