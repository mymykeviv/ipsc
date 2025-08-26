#!/usr/bin/env bash
# ProfitPath Release Packager
# Builds backend + frontend images locally, pushes to Docker Hub, and generates
# a user-friendly deployment package that runs on any OS with Docker installed.
#
# Usage:
#   scripts/release-packager.sh [--quick] [--platform <linux/amd64|linux/arm64|linux/amd64,linux/arm64>] <version> <dockerhub_username>
#
# Examples:
#   scripts/release-packager.sh --quick 1.0.1 myuser
#   scripts/release-packager.sh --platform linux/amd64,linux/arm64 1.0.1 myuser

set -euo pipefail

# ------------------------- Styling ------------------------------------------
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

retry() {
  local attempts=${1:-5}; shift
  local delay=2
  local n=0
  until "$@"; do
    n=$((n+1))
    if [[ $n -ge $attempts ]]; then
      return 1
    fi
    sleep $(( delay ** n ))
  done
}

# ------------------------- Args ---------------------------------------------
QUICK=0
PLATFORM="linux/amd64,linux/arm64"
POSITIONALS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --quick) QUICK=1; shift ;;
    --platform) PLATFORM="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: scripts/release-packager.sh [--quick] [--platform <p>] <version> <dockerhub_username>"; exit 0 ;;
    *) POSITIONALS+=("$1"); shift ;;
  esac
done
set -- "${POSITIONALS[@]:-}"

VERSION=${1:-}
DOCKERHUB_USERNAME=${2:-}
if [[ -z "$VERSION" || -z "$DOCKERHUB_USERNAME" ]]; then
  status fail "Provide <version> and <dockerhub_username>"
  exit 1
fi

status info "Release Version: $VERSION"
status info "Docker Hub: $DOCKERHUB_USERNAME"
status info "Mode: $([[ $QUICK -eq 1 ]] && echo Quick || echo Full)"
status info "Platform(s): $PLATFORM"

# ------------------------- Preflight ----------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  status fail "Docker not found. Install Docker Desktop or Docker Engine."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  status fail "Docker daemon not running. Start Docker and retry."
  exit 1
fi
if ! docker info | grep -q "Username"; then
  status warn "Not logged into Docker Hub. Running 'docker login'..."
  docker login
fi

# Ensure buildx
if ! docker buildx version >/dev/null 2>&1; then
  status warn "Docker buildx not available; multi-arch disabled. Falling back to docker build."
  PLATFORM=""
fi

# Cache-busting arg to avoid stale frontend assets
CACHE_BUST="BUILD_TS=$(date +%s)"

# ------------------------- Build Functions ----------------------------------
build_backend() {
  status info "Building backend image..."
  local img="$DOCKERHUB_USERNAME/profitpath-backend:$VERSION"
  if [[ $QUICK -eq 1 || -z "$PLATFORM" ]]; then
    docker build --pull \
      -t "$img" -t "$DOCKERHUB_USERNAME/profitpath-backend:latest" \
      -f backend/Dockerfile backend
  else
    docker buildx build --pull --platform "$PLATFORM" --target production \
      -t "$img" -t "$DOCKERHUB_USERNAME/profitpath-backend:latest" \
      -f backend/Dockerfile --push backend
  fi
  status ok "Backend build complete"
}

validate_frontend_image() {
  # Ensure dist exists inside image
  local img="$1"
  status info "Validating frontend image static assets..."
  docker run --rm "$img" sh -lc '
    set -e
    test -f /usr/share/nginx/html/index.html
    test -d /usr/share/nginx/html/assets
    ls -1 /usr/share/nginx/html/assets | grep -E "\.js$|\.css$" >/dev/null
  '
  status ok "Frontend assets present (index.html and assets/*.js|*.css)"
}

build_frontend() {
  status info "Building frontend image (optimized)..."
  local img="$DOCKERHUB_USERNAME/profitpath-frontend:$VERSION"
  if [[ $QUICK -eq 1 || -z "$PLATFORM" ]]; then
    # No cache to avoid stale dist
    docker build --pull --no-cache \
      --build-arg $CACHE_BUST \
      -t "$img" -t "$DOCKERHUB_USERNAME/profitpath-frontend:latest" \
      -f frontend/Dockerfile.optimized frontend
  else
    docker buildx build --pull --platform "$PLATFORM" --target production \
      --build-arg $CACHE_BUST \
      -t "$img" -t "$DOCKERHUB_USERNAME/profitpath-frontend:latest" \
      -f frontend/Dockerfile.optimized --push frontend
  fi
  validate_frontend_image "$img"
  status ok "Frontend build complete"
}

push_images_if_needed() {
  if [[ $QUICK -eq 1 || -z "$PLATFORM" ]]; then
    status info "Pushing images to Docker Hub..."
    retry 5 docker push "$DOCKERHUB_USERNAME/profitpath-backend:$VERSION"
    retry 5 docker push "$DOCKERHUB_USERNAME/profitpath-backend:latest"
    retry 5 docker push "$DOCKERHUB_USERNAME/profitpath-frontend:$VERSION"
    retry 5 docker push "$DOCKERHUB_USERNAME/profitpath-frontend:latest"
    status ok "Images pushed"
  else
    status info "Images already pushed via buildx --push"
  fi
}

# ------------------------- Build -------------------------------------------
build_backend
build_frontend
push_images_if_needed

# ------------------------- Package -----------------------------------------
status info "Generating deployment package..."
rm -rf deployment-package
mkdir -p deployment-package

# Compose file (no version key)
cat > deployment-package/docker-compose.yml <<EOF
services:
  database:
    image: postgres:16-alpine
    container_name: profitpath-database
    environment:
      POSTGRES_USER: profitpath
      POSTGRES_PASSWORD: profitpath123
      POSTGRES_DB: profitpath
    ports:
      - "5432:5432"
    volumes:
      - database_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U profitpath"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks: [profitpath-network]

  backend:
    image: $DOCKERHUB_USERNAME/profitpath-backend:$VERSION
    container_name: profitpath-backend
    environment:
      DATABASE_URL: postgresql+psycopg://profitpath:profitpath123@database:5432/profitpath
      SECRET_KEY: change-me
      DEBUG: "false"
      LOG_LEVEL: INFO
      CORS_ORIGINS: "*"
    depends_on:
      database:
        condition: service_healthy
    expose: ["8000"]
    command: sh -c "alembic upgrade head && python -c 'from app.seed import run_seed; run_seed()' && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks: [profitpath-network]

  frontend:
    image: $DOCKERHUB_USERNAME/profitpath-frontend:$VERSION
    container_name: profitpath-frontend
    expose: ["80"]
    depends_on: [backend]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks: [profitpath-network]

  nginx:
    image: nginx:alpine
    container_name: profitpath-nginx
    ports: ["80:80"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on: [frontend, backend]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks: [profitpath-network]

volumes:
  database_data:

networks:
  profitpath-network:
    driver: bridge
EOF

# NGINX config: upstreams and proxy
cat > deployment-package/nginx.conf <<'EOF'
events { worker_connections 1024; }
http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  sendfile on; tcp_nopush on; tcp_nodelay on; keepalive_timeout 65;
  gzip on; gzip_vary on; gzip_min_length 1024; gzip_types text/plain text/css application/json application/javascript image/svg+xml;

  upstream backend { server backend:8000; }
  upstream frontend { server frontend:80; }

  server {
    listen 80; server_name localhost;

    location /api/ {
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_connect_timeout 30s; proxy_send_timeout 30s; proxy_read_timeout 30s;
    }

    # Health endpoint
    location /health { access_log off; return 200 "healthy\n"; add_header Content-Type text/plain; }

    # Frontend
    location / { proxy_pass http://frontend; }
  }
}
EOF

# start.sh
cat > deployment-package/start.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Provide a safe default for VERSION to avoid 'unbound variable' when not set
VERSION=${VERSION:-"unknown"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

compose() {
  if docker compose version >/dev/null 2>&1; then docker compose "$@"; 
  elif command -v docker-compose >/dev/null 2>&1; then docker-compose "$@"; 
  else echo "docker compose not found"; exit 1; fi
}

retry() { local a=${1:-5}; shift; local d=2; local n=0; until "$@"; do n=$((n+1)); [[ $n -ge $a ]] && return 1; sleep $(( d ** n )); done; }

echo ""
echo "========================================"
echo "  ProfitPath v$VERSION"
echo "  Starting Application..."
echo "========================================"
echo ""

if ! docker info >/dev/null 2>&1; then echo "❌ Docker is not running"; exit 1; fi
[[ -f docker-compose.yml ]] || { echo "❌ docker-compose.yml not found"; exit 1; }

echo "📥 Pulling images..."
retry 5 docker pull postgres:16-alpine || true
retry 5 docker pull nginx:alpine || true
retry 5 compose -f docker-compose.yml pull

echo "🚀 Starting services..."
retry 5 compose -f docker-compose.yml up -d

echo "⏳ Waiting for services to come up..."; sleep 15

if curl -fsS http://localhost:8000/health >/dev/null; then echo "✅ Backend healthy"; else echo "⚠️  Backend not ready"; fi
if curl -fsS http://localhost/health >/dev/null; then echo "✅ Nginx healthy"; else echo "⚠️  Nginx not ready"; fi

echo ""
echo "Open: http://localhost"
echo "API:  http://localhost/api/"
echo ""
echo "Logs: compose -f docker-compose.yml logs -f"
echo "Stop: ./stop.sh"
EOF
chmod +x deployment-package/start.sh

# stop.sh
cat > deployment-package/stop.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
compose() { if docker compose version >/dev/null 2>&1; then docker compose "$@"; else docker-compose "$@"; fi }
echo "🛑 Stopping ProfitPath..."
compose -f docker-compose.yml down
echo "✅ Stopped"
EOF
chmod +x deployment-package/stop.sh

# README
cat > deployment-package/README.md <<EOF
# ProfitPath v$VERSION - Easy Deployment

This package lets you run ProfitPath locally with Docker in minutes.

## Requirements
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)

## Quick Start
1. Double-click start.bat (Windows) or run `./start.sh` (Mac/Linux)
2. Open http://localhost

## Services
- Web: http://localhost
- API: http://localhost/api/
- DB:  localhost:5432 (user: profitpath / pass: profitpath123)

## Troubleshooting
- Ensure Docker is running
- Use `docker compose -f docker-compose.yml logs -f`
- If first load is blank, wait 30-60s and refresh

Enjoy!
EOF

# Windows scripts (simple)
cat > deployment-package/start.bat <<EOF
@echo off
cd /d %~dp0
if exist docker-compose.yml (
  echo Pulling images...
  docker-compose pull
  echo Starting...
  docker-compose up -d
  echo Open http://localhost
) else (
  echo docker-compose.yml not found
)
EOF

cat > deployment-package/stop.bat <<'EOF'
@echo off
cd /d %~dp0
docker-compose down
echo Stopped
EOF

# Make archives
status info "Creating archives..."
zip -qr "profitpath-v$VERSION-windows.zip" deployment-package/
tar -czf "profitpath-v$VERSION-linux-mac.tar.gz" -C deployment-package .
status ok "Artifacts created: profitpath-v$VERSION-windows.zip, profitpath-v$VERSION-linux-mac.tar.gz"

status ok "Release complete. Share the archives or the deployment-package/ folder with users."
