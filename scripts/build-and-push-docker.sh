#!/bin/bash

# Local Docker Build and Push Script
# This script builds and pushes Docker images to Docker Hub locally
# Usage: ./scripts/build-and-push-docker.sh [--preflight] [--quick] [version] [dockerhub-username]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "FAILED")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Flags and args
PREFLIGHT_ONLY=0
QUICK_BUILD=0
POSITIONALS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --preflight)
      PREFLIGHT_ONLY=1; shift ;;
    --quick)
      QUICK_BUILD=1; shift ;;
    -h|--help)
      echo "Usage: ./scripts/build-and-push-docker.sh [--preflight] [--quick] [version] [dockerhub-username]"; exit 0 ;;
    *) POSITIONALS+=("$1"); shift ;;
  esac
done
set -- "${POSITIONALS[@]:-}"

# Get version and Docker Hub username
VERSION=${1:-$(cat VERSION 2>/dev/null || echo "1.4.5")}
DOCKERHUB_USERNAME=${2:-"your-dockerhub-username"}

print_status "INFO" "Building and pushing Docker images"
print_status "INFO" "Version: $VERSION"
print_status "INFO" "Docker Hub Username: $DOCKERHUB_USERNAME"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_status "FAILED" "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if logged into Docker Hub
if ! docker info | grep -q "Username"; then
    print_status "WARNING" "Not logged into Docker Hub. Please run: docker login"
    print_status "INFO" "You can also set DOCKER_USERNAME and DOCKER_PASSWORD environment variables"
    read -p "Do you want to continue with docker login? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker login
    else
        print_status "FAILED" "Docker Hub login required"
        exit 1
    fi
fi

# If preflight only, exit now after checks
if [[ "$PREFLIGHT_ONLY" == "1" ]]; then
    print_status "SUCCESS" "Preflight checks passed."
    exit 0
fi

# Retry helper
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

# Function to build and push image
build_and_push() {
    local service=$1
    local dockerfile_path=$2
    local build_context=$3
    
    print_status "INFO" "Building $service image..."
    
    # Build the image
    if {
        if [[ "$QUICK_BUILD" == "1" ]]; then
            docker build \
                --target production \
                -t "$DOCKERHUB_USERNAME/$service:$VERSION" \
                -t "$DOCKERHUB_USERNAME/$service:latest" \
                -f "$dockerfile_path" \
                "$build_context"
        else
            # Use buildx for multi-arch and push directly to avoid client-side push EOFs
            docker buildx build \
                --platform linux/amd64,linux/arm64 \
                --target production \
                -t "$DOCKERHUB_USERNAME/$service:$VERSION" \
                -t "$DOCKERHUB_USERNAME/$service:latest" \
                -f "$dockerfile_path" \
                --push \
                "$build_context"
        fi
      }; then
        
        print_status "SUCCESS" "$service image built successfully"
        
        # Push for quick builds (non-buildx). buildx path already pushed via --push
        if [[ "$QUICK_BUILD" == "1" ]]; then
          print_status "INFO" "Pushing $service image to Docker Hub..."
          if retry 5 docker push "$DOCKERHUB_USERNAME/$service:$VERSION" && \
             retry 5 docker push "$DOCKERHUB_USERNAME/$service:latest"; then
              print_status "SUCCESS" "$service image pushed successfully"
              return 0
          else
              print_status "FAILED" "Failed to push $service image"
              return 1
          fi
        else
          print_status "INFO" "$service images were pushed via buildx --push"
          return 0
        fi
    else
        print_status "FAILED" "Failed to build $service image"
        return 1
    fi
}

# Build and push backend
print_status "INFO" "Starting backend build..."
if build_and_push "profitpath-backend" "backend/Dockerfile" "backend"; then
    print_status "SUCCESS" "Backend build and push completed"
else
    print_status "FAILED" "Backend build and push failed"
    exit 1
fi

# Build and push frontend (optimized, serves on port 80)
print_status "INFO" "Starting frontend build (optimized, port 80)..."
if build_and_push "profitpath-frontend" "frontend/Dockerfile.optimized" "frontend"; then
    print_status "SUCCESS" "Frontend build and push completed"
else
    print_status "FAILED" "Frontend build and push failed"
    exit 1
fi

# Create deployment package (skip if quick build)
if [[ "$QUICK_BUILD" == "1" ]]; then
  print_status "INFO" "Quick build mode: skipping deployment package creation."
else
  print_status "INFO" "Creating deployment package..."
fi
mkdir -p deployment-package

# Create docker-compose.yml for Docker Hub images
cat > deployment-package/docker-compose.yml << EOF
version: '3.8'

services:
  # Database Service
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
    networks:
      - profitpath-network

  # Backend API Service
  backend:
    image: $DOCKERHUB_USERNAME/profitpath-backend:$VERSION
    container_name: profitpath-backend
    environment:
      ENVIRONMENT: production
      DATABASE_URL: postgresql+psycopg://profitpath:profitpath123@database:5432/profitpath
      SECRET_KEY: your-secret-key-change-this-in-production
      DEBUG: "false"
      LOG_LEVEL: INFO
      CORS_ORIGINS: "*"
    depends_on:
      database:
        condition: service_healthy
    expose:
      - "8000"
    volumes:
      - backend_logs:/app/logs
    command: sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - profitpath-network

  # Frontend Web Application
  frontend:
    image: $DOCKERHUB_USERNAME/profitpath-frontend:$VERSION
    container_name: profitpath-frontend
    expose:
      - "80"
    environment:
      VITE_API_URL: http://backend:8000
      VITE_APP_ENV: production
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - profitpath-network

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: profitpath-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - profitpath-network

volumes:
  database_data:
  backend_logs:

networks:
  profitpath-network:
    driver: bridge
EOF

# Create nginx configuration (still created even in quick mode for consistency)
cat > deployment-package/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Upstream backend
    upstream backend {
        server backend:8000;
    }

    # Upstream frontend
    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name localhost;

        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Frontend proxy
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Security
        location ~ /. {
            deny all;
        }
    }
}
EOF

# Create startup scripts
cat > deployment-package/start.sh << 'EOF'
#!/bin/bash

echo ""
echo "========================================"
echo "   ProfitPath v'$VERSION'"
echo "   Starting Application..."
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ ERROR: Docker is not running!"
  echo "   Please start Docker and try again."
  echo ""
  exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "❌ ERROR: docker-compose is not installed!"
  echo "   Please install docker-compose and try again."
  echo ""
  exit 1
fi

echo "✅ Docker is running. Starting services..."
echo ""

# Pull latest images
echo "📥 Downloading latest application files..."
docker-compose pull

# Start services
echo "🚀 Starting IPSC services..."
docker-compose up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to start (this may take a few minutes)..."
sleep 30

# Check if services are running
echo ""
echo "🔍 Checking if services are ready..."

# Try to check backend health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
  echo "✅ Backend is ready"
else
  echo "⚠️  Backend is still starting up..."
fi

# Try to check frontend via nginx
if curl -f http://localhost > /dev/null 2>&1; then
  echo "✅ Frontend is ready"
else
  echo "⚠️  Frontend is still starting up..."
fi

# Try to check nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
  echo "✅ Nginx is ready"
else
  echo "⚠️  Nginx is still starting up..."
fi

echo ""
echo "========================================"
echo "   🎉 ProfitPath is starting up!"
echo "========================================"
echo ""
echo "📱 Open your web browser and go to:"
echo "   http://localhost"
echo ""
echo "🔧 Backend API: http://localhost:8000"
echo "🗄️  Database: localhost:5432"
echo ""
echo "⏳ If the page doesn't load immediately,"
echo "   wait a few more minutes for all services"
echo "   to fully start up."
echo ""
echo "========================================"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop: docker-compose down"
echo "  Restart: docker-compose restart"
echo ""
EOF

# Create Windows startup script
cat > deployment-package/start.bat << 'EOF'
@echo off
echo.
echo ========================================
echo    ProfitPath v'$VERSION'
echo    Starting Application...
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker is not running!
  echo Please start Docker Desktop and try again.
  echo.
  pause
  exit /b 1
)

echo Docker is running. Starting services...
echo.

REM Pull latest images
echo Downloading latest application files...
docker-compose pull

REM Start services
echo Starting IPSC services...
docker-compose up -d

REM Wait for services
echo.
echo Waiting for services to start (this may take a few minutes)...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo.
echo Checking if services are ready...

REM Try to check backend health
curl -f http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
  echo WARNING: Backend is still starting up...
) else (
  echo Backend is ready
)

REM Try to check frontend via nginx
curl -f http://localhost >nul 2>&1
if errorlevel 1 (
  echo WARNING: Frontend is still starting up...
) else (
  echo Frontend is ready
)

REM Try to check nginx
curl -f http://localhost/health >nul 2>&1
if errorlevel 1 (
  echo WARNING: Nginx is still starting up...
) else (
  echo Nginx is ready
)

echo.
echo ========================================
echo    ProfitPath is starting up!
echo ========================================
echo.
echo Open your web browser and go to:
echo    http://localhost
echo.
echo Backend API: http://localhost:8000
echo Database: localhost:5432
echo.
echo If the page doesn't load immediately,
echo    wait a few more minutes for all services
echo    to fully start up.
echo.
echo ========================================
echo.
echo Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop: docker-compose down
echo   Restart: docker-compose restart
echo.
pause
EOF

# Create stop scripts
cat > deployment-package/stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping ProfitPath..."
docker-compose down
echo "✅ ProfitPath stopped"
echo ""
echo "To start again, run: ./start.sh"
EOF

cat > deployment-package/stop.bat << 'EOF'
@echo off
echo.
echo Stopping ProfitPath...
docker-compose down
echo.
echo ProfitPath stopped.
echo.
echo To start again, run: start.bat
echo.
pause
EOF

# Create README
cat > deployment-package/README.md << EOF
# ProfitPath v$VERSION - Easy Deployment Package

## Welcome to ProfitPath!

This package contains everything you need to run IPSC on your computer. 
**No technical knowledge required!**

## Quick Start (3 Simple Steps)

### Step 1: Install Docker
- **Windows/Mac**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: Install Docker using your package manager

### Step 2: Start ProfitPath
- **Windows**: Double-click `start.bat`
- **Mac/Linux**: Double-click `start.sh` or run `./start.sh` in terminal

### Step 3: Open Your Browser
- Go to: **http://localhost**
- Login with: **admin** / **admin123**

**That's it!** 

## What You Get

- **Web Application**: http://localhost
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432

## Management Commands

### Windows Users:
```cmd
start.bat    - Start ProfitPath
stop.bat     - Stop ProfitPath
```

### Mac/Linux Users:
```bash
./start.sh   - Start ProfitPath
./stop.sh    - Stop ProfitPath
```

## System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **Docker**: Latest version

## Troubleshooting

### "Docker is not running" Error
- Start Docker Desktop (Windows/Mac)
- Start Docker service (Linux)

### "Page not found" Error
- Wait 2-3 minutes for services to start
- Check if Docker containers are running

### "Port already in use" Error
- Stop other applications using ports 80, 8000, or 5432
- Or change ports in docker-compose.yml

## Security Notes

- Change default passwords in production
- This setup is for local use only
- For production, configure proper security settings

## Need Help?

- Check the logs: `docker-compose logs -f`
- Visit our GitHub repository for support
- Create an issue if you need help

---
*ProfitPath v$VERSION - Built on $(date)*
EOF

# Make scripts executable
chmod +x deployment-package/start.sh
chmod +x deployment-package/stop.sh

# Create compressed packages (skip in quick mode)
if [[ "$QUICK_BUILD" == "1" ]]; then
  print_status "INFO" "Quick build mode: skipping archive creation."
else
  print_status "INFO" "Creating compressed packages..."

  # Create ZIP package
  zip -r "profitpath-v$VERSION-windows.zip" deployment-package/

  # Create TAR.GZ package
  tar -czf "profitpath-v$VERSION-linux-mac.tar.gz" -C deployment-package .

  # Create universal package
  tar -czf "profitpath-v$VERSION-universal.tar.gz" deployment-package/

  print_status "SUCCESS" "Compressed packages created:"
  echo "  - profitpath-v$VERSION-windows.zip"
  echo "  - profitpath-v$VERSION-linux-mac.tar.gz"
  echo "  - profitpath-v$VERSION-universal.tar.gz"
fi

print_status "SUCCESS" " Docker build and push completed successfully!"
print_status "INFO" " Deployment packages created in current directory"
print_status "INFO" " Images pushed to Docker Hub:"
echo "  - profitpath-backend:$VERSION"
echo "  - profitpath-frontend:$VERSION"
print_status "INFO" " Next steps:"
echo "  1. Share the deployment packages with users"
echo "  2. Users can run with just Docker installed"
echo "  3. No technical knowledge required!"
