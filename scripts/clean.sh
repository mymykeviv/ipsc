#!/bin/bash

# Simple Cleanup Script
# Cleans up containers, images, and volumes. Optionally target a stack.

set -e

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
COMPOSE_BASE="$ROOT_DIR/deployment/docker/docker-compose"
STACK=""
DEEP=0

usage() {
  cat <<EOF
Usage: ./scripts/clean.sh [--stack dev|uat|prod] [--deep]
  --stack   Target a specific compose stack to bring down with volumes
  --deep    Remove frontend/build artifacts and Python caches
  -h, --help Show this help
EOF
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack)
      STACK="$2"; shift 2 ;;
    --deep)
      DEEP=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *) echo "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

echo "🧹 Cleaning up..."

# Stop and remove containers for selected stack (if provided)
if [[ -n "$STACK" ]]; then
  case "$STACK" in
    dev|uat|prod) COMPOSE_FILE="${COMPOSE_BASE}.${STACK}.yml" ;;
    *) echo "Invalid --stack value: $STACK (expected dev|uat|prod)"; exit 1 ;;
  esac
  if [[ -f "$COMPOSE_FILE" ]]; then
    echo "Bringing down $STACK stack via $COMPOSE_FILE..."
    docker compose -f "$COMPOSE_FILE" down --volumes --remove-orphans 2>/dev/null || true
  else
    echo "Compose file not found: $COMPOSE_FILE"
  fi
else
  # Generic compose down (best-effort if a default compose file exists)
  docker compose down --volumes --remove-orphans 2>/dev/null || true
fi

# Remove unused containers/images/networks
docker system prune -f

# Deep clean artifacts
if [[ "$DEEP" == "1" ]]; then
  echo "Deep cleaning..."
  rm -rf "$ROOT_DIR/frontend/node_modules" || true
  rm -rf "$ROOT_DIR/frontend/dist" || true
  rm -rf "$ROOT_DIR/backend/__pycache__" || true
  rm -rf "$ROOT_DIR/backend/app/__pycache__" || true
  rm -rf "$ROOT_DIR/backend/.pytest_cache" || true
fi

echo "✅ Cleanup completed!"
