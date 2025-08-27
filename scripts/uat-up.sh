#!/usr/bin/env bash
set -euo pipefail

# Start UAT stack with Docker Compose and optionally run regression test suites.
# Usage:
#   SKIP_TESTS=1 ./scripts/uat-up.sh     # skip tests
#   ./scripts/uat-up.sh                  # run regression tests

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
COMPOSE_FILE="$ROOT_DIR/deployment/docker/docker-compose.uat.yml"

# Bring up the UAT stack
echo "[uat] Starting Docker UAT stack..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "[uat] Waiting for services to initialize..."
sleep 15

if [[ "${SKIP_TESTS:-0}" == "1" ]]; then
  echo "[uat] SKIP_TESTS=1, skipping regression tests."
  exit 0
fi

EXIT_CODE=0

# Backend regression tests
if docker compose -f "$COMPOSE_FILE" exec -T backend python -c "import pytest" >/dev/null 2>&1; then
  echo "[uat] Running backend regression tests..."
  if ! docker compose -f "$COMPOSE_FILE" exec -T backend pytest -q; then
    echo "[uat] Backend regression tests failed"; EXIT_CODE=1
  fi
else
  echo "[uat] Pytest not available in backend container; skipping backend tests."
fi

# Frontend E2E/regression tests (using ephemeral container with Playwright)
FRONTEND_DIR="$ROOT_DIR/frontend"
if [[ -d "$FRONTEND_DIR" ]]; then
  echo "[uat] Running frontend e2e/regression tests..."
  docker run --rm \
    --network host \
    -e CI=1 \
    -v "$FRONTEND_DIR":/app \
    -w /app \
    mcr.microsoft.com/playwright:v1.46.0-jammy bash -lc "\
      npm ci --no-audit --no-fund || npm install --no-audit --no-fund && \
      npx playwright install --with-deps chromium firefox && \
      npm run test:e2e:all" || EXIT_CODE=1
else
  echo "[uat] Frontend directory not found; skipping frontend tests."
fi

exit $EXIT_CODE
