#!/usr/bin/env bash
set -euo pipefail

# Start DEV stack with Docker Compose and optionally run basic tests.
# Usage:
#   SKIP_TESTS=1 ./scripts/dev-up.sh           # skip tests
#   ./scripts/dev-up.sh                        # run tests
#   ./scripts/dev-up.sh --setup                 # run preflight/setup first, then up + tests

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
COMPOSE_FILE="$ROOT_DIR/deployment/docker/docker-compose.dev.yml"
SETUP_FIRST=0

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --setup)
      SETUP_FIRST=1
      shift
      ;;
    -h|--help)
      echo "Usage: SKIP_TESTS=1 ./scripts/dev-up.sh [--setup]"; exit 0
      ;;
    *)
      echo "Unknown argument: $1"; exit 1
      ;;
  esac
done

# Optional preflight/setup
if [[ "$SETUP_FIRST" == "1" ]]; then
  if [[ -x "$ROOT_DIR/scripts/setup-docker-env.sh" ]]; then
    echo "[dev] Running preflight via scripts/setup-docker-env.sh..."
    "$ROOT_DIR/scripts/setup-docker-env.sh"
  else
    echo "[dev] setup-docker-env.sh not found; skipping preflight."
  fi
  echo "[dev] Pulling latest images for dev stack..."
  docker compose -f "$COMPOSE_FILE" pull || true
fi

# Bring up the dev stack
echo "[dev] Starting Docker dev stack..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "[dev] Waiting for backend health..."
# Wait for backend to be healthy (max ~60s)
for i in {1..30}; do
  if curl -fsS http://localhost:8000/health >/dev/null 2>&1; then
    echo "[dev] Backend is healthy."
    break
  fi
  sleep 2
  if [[ $i -eq 30 ]]; then
    echo "[dev] WARNING: Backend health not confirmed. Proceeding anyway."
  fi
done

if [[ "${SKIP_TESTS:-0}" == "1" ]]; then
  echo "[dev] SKIP_TESTS=1, skipping basic tests."
  exit 0
fi

# -------- Basic tests --------
EXIT_CODE=0

# Backend: run a small subset of tests inside the backend container, if pytest is available
if docker compose -f "$COMPOSE_FILE" exec -T backend python -c "import pytest" >/dev/null 2>&1; then
  echo "[dev] Running backend basic tests..."
  # Prefer markers or a minimal folder if available; fallback to quick run
  if ! docker compose -f "$COMPOSE_FILE" exec -T backend pytest -q -k "health or minimal"; then
    echo "[dev] Backend tests failed"; EXIT_CODE=1
  fi
else
  echo "[dev] Pytest not available in backend container; skipping backend tests."
fi

# Frontend: run minimal unit tests inside a transient node container mounted to frontend dir
FRONTEND_DIR="$ROOT_DIR/frontend"
if [[ -d "$FRONTEND_DIR" ]]; then
  echo "[dev] Running frontend minimal tests..."
  docker run --rm \
    -v "$FRONTEND_DIR":/app \
    -w /app \
    node:20-bookworm bash -lc "npm ci --no-audit --no-fund || npm install --no-audit --no-fund; npm run test:minimal" || EXIT_CODE=1
else
  echo "[dev] Frontend directory not found; skipping frontend tests."
fi

exit $EXIT_CODE
