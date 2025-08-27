#!/usr/bin/env bash
set -euo pipefail

# Stop a stack: dev | uat | prod (prod performs backup)
# Usage: ./scripts/stop-stack.sh [dev|uat|prod]

STACK=${1:-dev}
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
COMPOSE_DIR="$ROOT_DIR/deployment/docker"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; }

case "$STACK" in
  dev)
    FILE="$COMPOSE_DIR/docker-compose.dev.yml"
    ;;
  uat)
    FILE="$COMPOSE_DIR/docker-compose.uat.yml"
    ;;
  prod)
    FILE="$COMPOSE_DIR/docker-compose.prod.yml"
    ;;
  *)
    err "Unknown stack: $STACK (use dev|uat|prod)"
    exit 1
    ;;
esac

if [[ ! -f "$FILE" ]]; then
  err "Compose file not found: $FILE"
  exit 1
fi

if [[ "$STACK" == "prod" ]]; then
  log "Running backup before stopping prod..."
  if [[ -x "$ROOT_DIR/scripts/backup.sh" ]]; then
    (cd "$ROOT_DIR" && ./scripts/backup.sh) || warn "Backup script failed; proceeding to stop."
  else
    warn "backup.sh not found or not executable; skipping backup."
  fi
fi

log "Stopping $STACK stack via $FILE"
docker compose -f "$FILE" down --remove-orphans || true
ok "$STACK stack stopped"
