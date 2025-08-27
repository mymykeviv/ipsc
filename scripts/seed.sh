#!/usr/bin/env bash
set -euo pipefail

# Unified seeding script
# Usage: ./scripts/seed.sh [dev|test]
# Requires: active Python venv and running Postgres container for the selected stack

MODE=${1:-dev}
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$ROOT_DIR/backend"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; }

if [[ ! -d "$BACKEND_DIR" ]]; then
  err "Run from project root; backend dir not found"
  exit 1
fi

if [[ -z "${VIRTUAL_ENV:-}" ]]; then
  warn "No active virtualenv detected. Activate with: source .venv/bin/activate"
  exit 1
fi

case "$MODE" in
  dev)
    DB_CONTAINER="profitpath-postgres-dev"
    DB_NAME="profitpath"
    PY_CMD="from app.dev_seed import run_dev_seed; run_dev_seed()"
    ;;
  test)
    DB_CONTAINER="profitpath-postgres-dev"
    DB_NAME="profitpath_test"
    PY_CMD="from app.test_seed import run_test_seed; run_test_seed()"
    ;;
  *)
    err "Unknown mode: $MODE. Use 'dev' or 'test'"
    exit 1
    ;;
esac

log "Checking PostgreSQL container ($DB_CONTAINER)"
if ! docker ps -q -f name="$DB_CONTAINER" | grep -q .; then
  err "Container $DB_CONTAINER not running. Start the stack first."
  exit 1
fi

if ! docker exec "$DB_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
  err "Postgres not ready in $DB_CONTAINER"
  exit 1
fi

# Ensure database exists
if ! docker exec "$DB_CONTAINER" psql -U postgres -lqt | cut -d '|' -f1 | grep -qw "$DB_NAME"; then
  warn "Database '$DB_NAME' not found. Creating..."
  docker exec "$DB_CONTAINER" createdb -U postgres "$DB_NAME"
  ok "Database '$DB_NAME' created"
fi

log "Running seed for $MODE"
(
  cd "$BACKEND_DIR"
  python -c "$PY_CMD"
)

ok "Seeding completed for $MODE"
