# Deployment Guide

## Overview

This document describes the consolidated deployment system for ProfitPath (IPSC), which supports four modes/environments:
- **Development (dev)**: Docker Compose with hot reloading
- **UAT**: Docker Compose with production-like settings
- **Production (prod)**: Kubernetes with high availability
- **Standalone (local)**: Simple local run via Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- kubectl (for production deployments)
- Kubernetes cluster (for production)

### Basic Deployment Commands

```bash
# Development environment
python deployment/deploy.py dev

# UAT environment
python deployment/deploy.py uat --test

# Production environment
python deployment/deploy.py prod --clean
```

## Environment Configurations

## Environment Behavior and Ports

- **Frontend in Dev/Local (standalone)**: runs Vite on port 5173.
- **Frontend in UAT/Prod**: served by Nginx on port 80 using `frontend/Dockerfile.optimized`.
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

### UAT Environment

**Purpose**: User Acceptance Testing with production-like settings

**Features**:
- Production-like configuration
- Separate database instance
- Health checks enabled
- Optimized for testing

Frontend is built using the optimized Dockerfile (Nginx, port 80 in container).

**Access Points**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- Database: localhost:5433

**Configuration**: `deployment/docker/docker-compose.uat.yml`

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

## Build and Push Images to Docker Hub

Use the provided script which builds multi-arch images and generates a deployment package. The frontend uses the optimized Dockerfile (Nginx on port 80).

```bash
# Set version and your Docker Hub username
./scripts/build-and-push-docker.sh 1.5.0 <your-dockerhub-username>

# Images produced and pushed:
# <your-dockerhub-username>/profitpath-backend:1.5.0, latest
# <your-dockerhub-username>/profitpath-frontend:1.5.0, latest (Dockerfile.optimized)
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

## Build and Deploy Locally on Docker (Standalone)

Standalone is intended for quick local runs. Frontend runs on Vite (5173) and is proxied by Nginx on port 80.

```bash
# Start
docker compose -f deployment/standalone/docker-compose.yml up -d --build

# Verify
curl -f http://localhost/health      # 200 from Nginx
curl -f http://localhost             # SPA proxied to frontend:5173
curl -f http://localhost/api/health || curl -f http://localhost:8000/health

# Logs
docker compose -f deployment/standalone/docker-compose.yml logs -f

# Stop
docker compose -f deployment/standalone/docker-compose.yml down
```

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

All deployments automatically clean caches to ensure clean builds:

```bash
# Manual cache cleaning
bash deployment/scripts/clean-cache.sh [environment]

# Cache cleaning is automatic during deployment
python deployment/deploy.py dev
```

### Testing

Run tests before deployment:

```bash
# Run tests before deployment
python deployment/deploy.py uat --test

# Skip tests
python deployment/deploy.py prod --skip-tests
```

### Clean Builds

Perform clean builds (removes all containers and images):

```bash
# Clean build for any environment
python deployment/deploy.py dev --clean
python deployment/deploy.py uat --clean
python deployment/deploy.py prod --clean
```

### Rollback

Rollback to previous deployment:

```bash
# Rollback production deployment
python deployment/deploy.py prod --rollback
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

1. **Port conflicts**: Ensure ports are not in use by other services
2. **Database connection**: Check database credentials and connectivity
3. **Cache issues**: Run manual cache cleaning if needed
4. **Kubernetes cluster**: Ensure kubectl is configured correctly

### Debug Commands

```bash
# Check service status
docker compose -f deployment/docker/docker-compose.dev.yml ps

# Check Kubernetes resources
kubectl get all -n cashflow-prod

# View detailed logs
docker compose -f deployment/docker/docker-compose.dev.yml logs [service-name]

# Check health endpoints
curl http://localhost:8000/health
curl http://localhost:5173
```

### Rollback Procedures

1. **Docker Compose rollback**:
   ```bash
   docker compose -f deployment/docker/docker-compose.dev.yml down
   git checkout HEAD~1
   python deployment/deploy.py dev
   ```

2. **Kubernetes rollback**:
   ```bash
   python deployment/deploy.py prod --rollback
   ```

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
