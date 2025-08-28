#!/bin/bash

# ProfitPath Release Creation Script
# Usage: ./scripts/create-release.sh [--skip-preflight] [--build-type <docker-dev|docker-prod|docker-prod-lite|production|prod-lite>] <version>
# Example: ./scripts/create-release.sh 1.42.0
#          ./scripts/create-release.sh --skip-preflight 1.42.0
#          ./scripts/create-release.sh --build-type production 1.42.0

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

status() {
  local kind=$1; shift
  case "$kind" in
    ok)    echo -e "${GREEN}✅ $*${NC}";;
    fail)  echo -e "${RED}❌ $*${NC}";;
    warn)  echo -e "${YELLOW}⚠️  $*${NC}";;
    info)  echo -e "${BLUE}ℹ️  $*${NC}";;
    *)     echo "$*";;
  esac
}

retry() { local attempts=${1:-5}; shift; local delay=2; local n=0; until "$@"; do n=$((n+1)); [[ $n -ge $attempts ]] && return 1; sleep $(( delay ** n )); done; }

SKIP_PREFLIGHT=0
BUILD_TYPE="production"
POSITIONALS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-preflight) SKIP_PREFLIGHT=1; shift ;;
    --build-type)
      BUILD_TYPE="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--skip-preflight] [--build-type <docker-dev|docker-prod|docker-prod-lite|production|prod-lite>] <version>"; exit 0 ;;
    *) POSITIONALS+=("$1"); shift ;;
  esac
done
set -- "${POSITIONALS[@]:-}"

VERSION=${1:-}

if [[ -z "$VERSION" ]]; then
  echo "❌ Error: Version number is required"
  echo ""
  echo "Usage: $0 [--skip-preflight] [--build-type <docker-dev|docker-prod|docker-prod-lite|production|prod-lite>] <version>"
  echo "Example: $0 1.42.0"
  echo "This script will:"
  echo "1. Optionally run preflight checks (frontend typecheck/lint/build, backend migrations)"
  echo "2. Update the VERSION file"
  echo "3. Create a git tag"
  echo "4. Push to GitHub and trigger the pipelines"
  exit 1
fi

echo "🚀 Creating ProfitPath release v$VERSION"
echo "========================================"
echo "Build Type: $BUILD_TYPE"

# Validate build type and map to compose files (for CI or packager parity)
# Note: docker-* variants are intended for local verification with maximum debugging enabled
#       production/prod-lite are intended for distributable artifacts with debugging disabled
case "$BUILD_TYPE" in
  docker-dev)
    COMPOSE_SRC="deployment/docker/docker-compose.dev.yml" ;;
  docker-prod)
    COMPOSE_SRC="deployment/docker/docker-compose.prod.local.yml" ;;
  docker-prod-lite)
    COMPOSE_SRC="deployment/docker/docker-compose.prod-lite.local.yml" ;;
  production)
    COMPOSE_SRC="deployment/docker/docker-compose.prod.yml" ;;
  prod-lite)
    COMPOSE_SRC="deployment/docker/docker-compose.prod-lite.yml" ;;
  *)
    echo "⚠️  Warning: Unknown build type '$BUILD_TYPE'. Defaulting to 'production'" >&2
    BUILD_TYPE="production"
    COMPOSE_SRC="deployment/docker/docker-compose.prod.yml" ;;
esac
echo "Compose file (expected): $COMPOSE_SRC"

preflight_checks() {
  if [[ $SKIP_PREFLIGHT -eq 1 ]]; then
    status warn "Skipping preflight checks as requested (--skip-preflight)"
    return 0
  fi

  # Frontend checks (host Node/npm)
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    status info "Running frontend typecheck/lint/build..."
    pushd frontend >/dev/null
    if [[ -f package.json ]]; then
      npm ci --no-optional
      npm run typecheck
      npm run lint
      npm run build
      status ok "Frontend checks passed"
    else
      status warn "frontend/package.json not found; skipping frontend checks"
    fi
    popd >/dev/null
  else
    status warn "Node/npm not found; skipping frontend checks"
  fi

  # Backend migration sanity via Docker only
  if ! command -v docker >/dev/null 2>&1; then
    status warn "Docker not found; skipping backend migration preflight"
    return 0
  fi

  status info "Validating backend migrations against fresh Postgres..."
  local NET="pp_rel_net_$$"
  local DB="pp_rel_db_$$"
  docker network create "$NET" >/dev/null
  cleanup_preflight() {
    docker rm -f "$DB" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
  }
  trap cleanup_preflight EXIT

  docker run -d --rm --name "$DB" --network "$NET" \
    -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=profitpath_check \
    -p 0:5432 postgres:13 >/dev/null

  status info "Waiting for Postgres to be ready..."
  retry 10 docker run --rm --network "$NET" --entrypoint bash postgres:13 -lc \
    "pg_isready -h $DB -U postgres"

  docker run --rm --network "$NET" -e DATABASE_URL="postgresql://postgres:postgres@$DB:5432/profitpath_check" \
    -v "$(pwd)/backend":/app -w /app python:3.12-slim bash -lc \
    "pip install --no-cache-dir -r requirements.txt && alembic -c alembic.ini upgrade head"

  status ok "Backend migrations applied successfully on a fresh DB"

  cleanup_preflight
  trap - EXIT
}

preflight_checks

# Update VERSION file
echo "📝 Updating VERSION file..."
echo "$VERSION" > VERSION

# Commit and tag
echo "🏷️  Creating git tag..."
git add VERSION
git commit -m "Bump version to $VERSION (build-type: $BUILD_TYPE)"
git tag -a "v$VERSION" -m "Release version $VERSION

build_type=$BUILD_TYPE
compose=$COMPOSE_SRC
"

# Push to GitHub
echo "📤 Pushing to GitHub..."
CURRENT_BRANCH=$(git branch --show-current)
git push origin "$CURRENT_BRANCH"
git push origin "v$VERSION"

echo ""
echo "✅ Release v$VERSION created successfully!"
echo ""
echo "🎯 What happens next:"
echo "1. GitHub Actions will automatically build the deployment packages"
echo "2. Docker images will be created and pushed to registry"
echo "3. User-friendly deployment packages will be generated"
echo "4. A GitHub release will be created with download links"
echo ""
echo "⏳ Check the Actions tab for build progress:"
echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\([^\/]*\/[^\/]*\).*/\1/')/actions"
echo ""
echo "🎉 Users will be able to download and run ProfitPath with just Docker!"
