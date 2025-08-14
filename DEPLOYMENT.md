# Cashflow Deployment Guide

## Overview

This guide covers the deployment process for the Cashflow application, including both Docker and local development environments. The deployment system has been enhanced to automatically handle file cleanup and ensure TypeScript files are always used.

## 🚀 Quick Start

### Docker Development (Recommended)

```bash
# Deploy with automatic file cleanup
./scripts/deploy-dev.sh

# Deploy with Docker cache cleanup
./scripts/deploy-dev.sh --clean-cache
```

### Local Development

```bash
# Start local development with automatic cleanup
./scripts/local-dev-clean.sh

# Or use the standard local development script
./scripts/local-dev.sh
```

## 🔧 Deployment Solutions

### Problem Solved

**Issue**: Old compiled JavaScript files were interfering with TypeScript source files, causing UI changes to not reflect in the browser.

**Root Cause**: 
- Docker containers contained old `.js` files alongside updated `.tsx` files
- Vite was serving cached compiled files instead of TypeScript source
- Manual file cleanup was required for each deployment

### Permanent Solutions Implemented

#### 1. **Docker Development Environment**

**Enhanced Dockerfile** (`frontend/Dockerfile`):
- Multi-stage build with development and production targets
- Automatic cleanup of old compiled files during build
- Force flag to ensure TypeScript files are used
- Proper `.dockerignore` to prevent old files from being copied

**Updated Docker Compose** (`docker-compose.dev.yml`):
- Development target specification
- Automatic file cleanup on container startup
- Enhanced volume mounts to prevent file conflicts
- Polling configuration for better file watching

#### 2. **Local Development Environment**

**Enhanced Local Scripts**:
- Automatic cleanup of old compiled files
- TypeScript-first approach
- Proper dependency management
- Health checks and validation

#### 3. **Vite Configuration**

**Updated Vite Config** (`frontend/vite.config.docker.ts`):
- Force flag to clear cache on startup
- TypeScript loader configuration
- Enhanced HMR (Hot Module Replacement)
- Proper proxy configuration

#### 4. **File Management**

**`.dockerignore`**:
- Excludes compiled JavaScript files
- Prevents build artifacts from being copied
- Ensures clean container builds

## 📋 Deployment Scripts

### `scripts/deploy-dev.sh`

**Purpose**: Automated Docker development deployment with file cleanup

**Features**:
- ✅ Automatic cleanup of old compiled files
- ✅ Docker container rebuilding
- ✅ Service health verification
- ✅ API connectivity testing
- ✅ Comprehensive status reporting

**Usage**:
```bash
# Standard deployment
./scripts/deploy-dev.sh

# Deployment with Docker cache cleanup
./scripts/deploy-dev.sh --clean-cache
```

### `scripts/local-dev-clean.sh`

**Purpose**: Local development with automatic file cleanup

**Features**:
- ✅ Automatic cleanup of old compiled files
- ✅ Python virtual environment setup
- ✅ Node.js dependency management
- ✅ Backend and frontend startup
- ✅ Health checks and validation
- ✅ Graceful shutdown handling

**Usage**:
```bash
./scripts/local-dev-clean.sh
```

### `scripts/local-dev.sh`

**Purpose**: Standard local development (enhanced with cleanup)

**Features**:
- ✅ Enhanced with automatic file cleanup
- ✅ All original local development features
- ✅ MailHog integration
- ✅ SQLite database setup

## 🔍 Verification Process

### Automatic Health Checks

All deployment scripts include comprehensive health checks:

1. **Container Status**: Verify all containers are running
2. **Frontend Accessibility**: Test frontend on port 5173
3. **Backend Health**: Test backend health endpoint
4. **API Proxy**: Test API connectivity through frontend
5. **Database Connectivity**: Verify database connections

### Manual Verification

After deployment, verify the following:

1. **Frontend**: `http://localhost:5173`
2. **Backend**: `http://localhost:8000/health`
3. **API Docs**: `http://localhost:8000/docs`
4. **Invoice Form**: `http://localhost:5173/invoices/add`
5. **Product Form**: `http://localhost:5173/products/add`

## 🛠️ Troubleshooting

### Common Issues

#### 1. **Old UI Still Visible**

**Symptoms**: Changes not reflecting in browser

**Solutions**:
```bash
# Clear browser cache
Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)

# Rebuild containers
./scripts/deploy-dev.sh --clean-cache

# Check file timestamps
docker exec cashflow-frontend-dev ls -la /app/src/components/
```

#### 2. **Container Build Failures**

**Symptoms**: Docker build errors

**Solutions**:
```bash
# Clean Docker cache
docker system prune -f

# Rebuild with no cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Use deployment script
./scripts/deploy-dev.sh --clean-cache
```

#### 3. **API Connection Issues**

**Symptoms**: Frontend can't connect to backend

**Solutions**:
```bash
# Check container status
docker ps

# Check backend logs
docker logs cashflow-backend-dev

# Verify network connectivity
docker exec cashflow-frontend-dev curl http://backend:8000/health
```

### Debug Commands

```bash
# Check container logs
docker logs cashflow-frontend-dev --tail 50
docker logs cashflow-backend-dev --tail 50

# Check file timestamps
docker exec cashflow-frontend-dev find /app/src -name "*.tsx" -exec ls -la {} \;

# Test API connectivity
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check Vite configuration
docker exec cashflow-frontend-dev cat /app/vite.config.docker.ts
```

## 📊 Performance Considerations

### Docker Development
- **Build Time**: ~2-3 minutes for initial build
- **Startup Time**: ~30 seconds for containers
- **Hot Reload**: ~1-2 seconds for file changes

### Local Development
- **Setup Time**: ~1-2 minutes for initial setup
- **Startup Time**: ~15 seconds for services
- **Hot Reload**: ~500ms for file changes

## 🔒 Security Notes

- Development environment uses default credentials
- Production deployments should use proper secrets management
- Database connections use development settings
- API endpoints are exposed for development convenience

## 📝 Best Practices

1. **Always use deployment scripts** instead of manual commands
2. **Clear browser cache** after deployment
3. **Check health endpoints** before testing
4. **Use `--clean-cache`** when experiencing issues
5. **Monitor container logs** for debugging
6. **Keep dependencies updated** regularly

## 🚀 Production Deployment

For production deployments, use the production Docker Compose configuration:

```bash
# Production deployment
./scripts/docker-prod.sh

# Kubernetes deployment
./scripts/k8s-deploy.sh
```

---

**Note**: This deployment system ensures that TypeScript changes are always reflected immediately without manual intervention.
