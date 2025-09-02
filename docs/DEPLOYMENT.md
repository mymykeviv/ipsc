# Deployment Guide

## Overview

This document describes the consolidated deployment system for ProfitPath (IPSC). We support multiple deployment options:

### Docker-based Deployments
- **docker-dev**: Docker Compose with hot reloading (local development)
- **docker-prod**: Local, prod-like verification with maximum debugging
- **docker-prod-lite**: Local, prod-lite (single-tenant) verification with maximum debugging
- **production**: Distributable production build (full features)
- **prod-lite**: Distributable production build for low-resource/single-tenant deployments

### Offline Installer Packages
- **Windows Offline Installer**: Self-contained package with automatic dependency management
- **Linux/Mac Offline Installer**: Cross-platform package for native deployment

See `docs/DEPLOYMENT_BUILDS.md` for the complete mapping between build types and compose files.

## Quick Start

### Offline Installer Deployment (Recommended for Production)

**For Windows:**
1. Download `ProfitPath-vX.X.X-Windows-Offline-Installer.zip`
2. Extract to desired location
3. Run `install.bat` as Administrator
4. Start application with `start-prod.bat`
5. Access at `http://localhost:3000` (or configured port)

**For Linux/Mac:**
1. Download `ProfitPath-vX.X.X-Linux-Offline-Installer.tar.gz`
2. Extract: `tar -xzf ProfitPath-vX.X.X-Linux-Offline-Installer.tar.gz`
3. Run: `./install.sh`
4. Start: `./start-prod.sh`
5. Access at `http://localhost:3000` (or configured port)

**Key Features:**
- ✅ Configurable port system with automatic conflict detection
- ✅ Automatic dependency installation (Python 3.8+, Node.js 16+)
- ✅ Database initialization with legacy engine support
- ✅ Production-ready configuration out of the box

### Docker Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- kubectl (for production deployments)
- Kubernetes cluster (for production)

### Basic Deployment Commands (Docker Compose)

```bash
# Development (hot reload)
docker compose -f deployment/docker/docker-compose.dev.yml up -d

# Local prod-like (debug enabled)
docker compose -f deployment/docker/docker-compose.prod.local.yml up -d

# Local prod-lite (debug enabled, single-tenant)
docker compose -f deployment/docker/docker-compose.prod-lite.local.yml up -d

# Distributable production (full features)
docker compose -f deployment/docker/docker-compose.prod.yml up -d

# Distributable prod-lite (single-tenant)
docker compose -f deployment/docker/docker-compose.prod-lite.yml up -d
```

## Environment Configurations

## Port Configuration

### Offline Installer Packages
The offline installer packages use a configurable port system:

- **Configuration File**: `config/ports.json`
- **Default Ports**: Backend (8000), Frontend (3000)
- **Automatic Port Checking**: Start scripts check port availability
- **Conflict Resolution**: Clear error messages if ports are in use
- **Easy Customization**: Edit `config/ports.json` to change ports

```json
{
  "backend_port": 8000,
  "frontend_port": 3000
}
```

### Docker Environment Ports

- **Frontend in docker-dev**: runs Vite on port 5173.
- **Frontend in production/prod-lite**: served by Nginx on port 80 using `frontend/Dockerfile.optimized`.
- **Backend**: FastAPI on port 8000 across all modes.

### Development Environment

**Purpose**: Local development with hot reloading and debugging capabilities

**Features**:
- Hot reloading for both frontend and backend
- MailHog for email testing
- Debug logging enabled
- Volume mounts for live code changes

**Access Points**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Database: localhost:5432
- MailHog: http://localhost:8025

**Configuration**: `deployment/docker/docker-compose.dev.yml`

> Note: The previous UAT stack is being phased out. Prefer `docker-prod` for local prod-like runs. The legacy `deployment/docker/docker-compose.uat.yml` may be removed in a future release.

### Production Environment

**Purpose**: High-availability production deployment

**Features**:
- Kubernetes orchestration
- Multiple replicas for high availability
- Resource limits and requests
- Health checks and auto-scaling
- Secrets management

Frontend is built using the optimized Dockerfile (Nginx, port 80 in container).

**Configuration**: `deployment/kubernetes/prod/`

## Build and Package Releases

Use the unified release and packager scripts. The frontend uses the optimized Dockerfile (Nginx on port 80) for production builds.

```bash
# Create a versioned release (runs preflight checks)
./scripts/create-release.sh --build-type production 1.50.7

# Build images and generate deployment packages
./scripts/release-packager.sh --build-type production 1.50.7 <your-dockerhub-username>

# For prod-lite
./scripts/release-packager.sh --build-type prod-lite 1.50.7 <your-dockerhub-username>
```

## Create a Release using GitHub Actions

The workflow `.github/workflows/deploy.yml` builds multi-arch images and can deploy to dev/uat/prod. It now builds the frontend with `frontend/Dockerfile.optimized` so UAT/Prod serve on port 80.

Steps:

1. Navigate to GitHub → Actions → "Automated Deployment Pipeline".
2. Click "Run workflow" and choose `environment`:
   - `dev` (tests with dev compose; frontend 5173)
   - `uat` (compose uat; frontend 80 via Nginx)
   - `prod` (compose prod; frontend 80 via Nginx, creates a Release)
3. Monitor logs. For prod, the job also creates a GitHub Release with tag `v<run_number>`.

## Local Runs (Recommended)

Use the Docker Compose files under `deployment/docker/` as shown above. The `deployment/standalone/` stack is deprecated and will be removed.

## Local Development without Docker

Run backend and frontend directly.

Backend (FastAPI on 8000):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ENVIRONMENT=development
export DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/profitpath
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend (Vite on 5173):

```bash
cd frontend
npm install
export VITE_API_URL=http://localhost:8000
npm run dev -- --host --port 5173
```

## Deployment Options

### Cache Cleaning

Use the unified clean script. You can target a specific stack and optionally deep-clean artifacts.

```bash
# General cleanup
./scripts/clean.sh

# Target a specific stack
./scripts/clean.sh --stack dev
./scripts/clean.sh --stack uat
./scripts/clean.sh --stack prod

# Deep clean (also removes build artifacts and caches)
./scripts/clean.sh --stack uat --deep
```

### Testing

Run tests with the unified test runner:

```bash
# Backend unit tests
./scripts/test-runner.sh backend

# Frontend unit/integration tests
./scripts/test-runner.sh frontend

# E2E tests (Playwright)
./scripts/test-runner.sh e2e

# Health checks
./scripts/test-runner.sh health

# All tests
./scripts/test-runner.sh all
```

### Clean Builds

For a clean slate before (re)deploying:

```bash
# Remove containers/images/volumes, targeting a stack
./scripts/clean.sh --stack dev
./scripts/clean.sh --stack uat
./scripts/clean.sh --stack prod

# Include build artifacts and caches
./scripts/clean.sh --stack prod --deep
```

### Rollback

Rollback strategy depends on how images are tagged. Typical steps:

```bash
# Stop current prod stack (includes backup step)
./scripts/stop-stack.sh prod

# Pull and start previous tags (example: v1.5.0)
IMAGE_TAG=v1.5.0 \
docker compose -f deployment/docker/docker-compose.prod.yml up -d --build

# Alternatively, edit compose to pin specific image tags, then:
docker compose -f deployment/docker/docker-compose.prod.yml pull
docker compose -f deployment/docker/docker-compose.prod.yml up -d
```

## Advanced Configuration

### Environment Variables

#### Development
```bash
# Default values (no additional setup required)
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
```

#### UAT
```bash
# Optional environment variables
export POSTGRES_USER=your_user
export POSTGRES_PASSWORD=your_password
export SECRET_KEY=your_secret_key
export CORS_ORIGINS=http://localhost:3000
```

#### Production
```bash
# Required environment variables
export POSTGRES_USER=your_prod_user
export POSTGRES_PASSWORD=your_prod_password
export POSTGRES_DB=cashflow_prod
export SECRET_KEY=your_prod_secret_key
export CORS_ORIGINS=https://yourdomain.com
export API_URL=https://api.yourdomain.com
```

### Kubernetes Production Setup

1. **Create namespace**:
   ```bash
   kubectl apply -f deployment/kubernetes/prod/namespace.yaml
   ```

2. **Apply configuration**:
   ```bash
   kubectl apply -f deployment/kubernetes/prod/configmap.yaml
   kubectl apply -f deployment/kubernetes/prod/secrets.yaml
   ```

3. **Deploy services**:
   ```bash
   kubectl apply -f deployment/kubernetes/prod/deployment.yaml
   kubectl apply -f deployment/kubernetes/prod/service.yaml
   ```

4. **Check deployment status**:
   ```bash
   kubectl get pods -n cashflow-prod
   kubectl get services -n cashflow-prod
   ```

## Monitoring and Health Checks

### Health Check Endpoints

- Backend: `http://localhost:8000/health` (all)
- Frontend:
  - Dev/Standalone: `http://localhost:5173`
  - UAT: `http://localhost:3000` (maps to container 80)
  - Prod: `http://localhost` (Nginx 80)

### Logs

```bash
# Docker Compose logs
docker compose -f deployment/docker/docker-compose.dev.yml logs -f

# Kubernetes logs
kubectl logs -f deployment/cashflow-backend -n cashflow-prod
kubectl logs -f deployment/cashflow-frontend -n cashflow-prod
```

### Resource Monitoring

```bash
# Docker resource usage
docker stats

# Kubernetes resource usage
kubectl top pods -n cashflow-prod
kubectl top nodes
```

## Troubleshooting

### Common Issues

#### Offline Installer Issues
1. **Administrator privileges required (Windows)**: 
   - **Primary Solution**: Right-click `install.bat` and select "Run as administrator"
   - **PowerShell Method**: Run `Start-Process cmd -Verb RunAs` then navigate to installer
   - **Command Prompt Method**: Open Command Prompt as administrator, then run installer
   - **UAC Issues**: Check Windows UAC settings in Control Panel
   - **Corporate Networks**: Contact IT admin if group policies block elevation
   - **Alternative**: Use portable installation method (manual setup)
   - **Technical Details**: The installer uses multiple detection methods:
     - `net session` command (primary)
     - `fsutil dirty query` (fallback)
     - `whoami /groups` with SID check (fallback)
   - **Enhanced Error Messages**: The installer includes specific troubleshooting steps if all methods fail
2. **Port conflicts**: 
   - Check `config/ports.json` for current port configuration
   - Use different ports if defaults are in use
   - Start script will show which ports are occupied
3. **Python version**: Ensure Python 3.8+ is installed and in PATH
4. **Node.js version**: Ensure Node.js 16+ is installed for frontend build
5. **Database initialization**: Uses legacy engine for compatibility

#### Docker Issues
1. **Port conflicts**: Ensure ports are not in use by other services
2. **Database connection**: Check database credentials and connectivity
3. **Cache issues**: Run manual cache cleaning if needed
4. **Kubernetes cluster**: Ensure kubectl is configured correctly

### Debug Commands

```bash
# Check service status
docker compose -f deployment/docker/docker-compose.dev.yml ps

# View detailed logs for a specific service
docker compose -f deployment/docker/docker-compose.dev.yml logs -f backend
docker compose -f deployment/docker/docker-compose.dev.yml logs -f frontend

# Kubernetes resources (prod)
kubectl get all -n cashflow-prod

# Health endpoints
curl http://localhost:8000/health
curl http://localhost:5173
```

### Rollback Procedures

1. **Docker Compose rollback**:
   ```bash
   ./scripts/stop-stack.sh prod
   # Pin previous image tags in compose, then
   docker compose -f deployment/docker/docker-compose.prod.yml up -d
   ```

2. **Kubernetes rollback**:
   Use your cluster's release strategy (e.g., kubectl rollout undo) against manifests in `deployment/kubernetes/prod/`.

## Security Considerations

### Development
- Uses default credentials (change for production)
- Debug mode enabled
- CORS allows localhost

### UAT
- Separate database instance
- Production-like security settings
- Limited CORS origins

### Production
- Kubernetes secrets management
- Resource limits and requests
- Health checks and auto-scaling
- Secure CORS configuration

## Performance Optimization

### Development
- Hot reloading for fast development
- Volume mounts for live changes
- Debug logging for troubleshooting

### UAT
- Production-like performance settings
- Optimized builds
- Health checks enabled

### Production
- Multiple replicas for high availability
- Resource limits and requests
- Auto-scaling capabilities
- Optimized container images

## Version Management

The deployment system automatically:
- Updates build information
- Tracks deployment timestamps
- Records git commit hashes
- Maintains version history

Check current version:
```bash
# Backend version
curl http://localhost:8000/version

# Build info
cat build-info.json
```

## Migration from Old System

If migrating from the old deployment system:

1. **Backup current deployment**:
   ```bash
   cp -r scripts scripts_backup
   cp -r docker-compose*.yml docker_backup/
   ```

2. **Update CI/CD pipelines** to use new deployment commands

3. **Test new deployment system** in development environment

4. **Update documentation** and team training

5. **Remove old deployment scripts** after successful migration

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review logs for error messages
3. Verify environment variables
4. Test in development environment first
5. Contact the DevOps team for production issues
