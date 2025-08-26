# Cashflow Deployment Documentation

## Overview

This directory contains the consolidated deployment system for Cashflow (Invoice Processing & Stock Control). The new system replaces the previous three separate deployment scripts with a single, well-documented approach that supports multiple environments.

## Quick Start

### Development Environment
```bash
# Start dev stack (hot reload)
./scripts/dev-up.sh

# Or directly via Compose
docker compose -f deployment/docker/docker-compose.dev.yml up -d
```

### UAT / Production
```bash
# UAT (prod-like)
docker compose -f deployment/docker/docker-compose.uat.yml up -d

# Production
docker compose -f deployment/docker/docker-compose.prod.yml up -d
```

Note: We use "UAT" in place of "staging".

## Environment Configurations

### Development (`dev`)
- **Purpose**: Local development with hot reloading
- **Services**: Frontend, Backend, Database (SQLite), MailHog
- **Features**: 
  - Hot reloading for frontend and backend
  - SQLite database for simplicity
  - MailHog for email testing
  - Fast startup times
- **Ports**: 
  - Frontend: 5173
  - Backend: 8000
  - MailHog: 1025 (SMTP), 8025 (Web UI)

### Staging (`staging`)
- **Purpose**: Testing environment for pre-production validation
- **Services**: Frontend, Backend, Database (PostgreSQL)
- **Features**:
  - Production-like environment
  - PostgreSQL database
  - Optimized builds
  - Health checks
- **Ports**:
  - Frontend: 80
  - Backend: 8000

### Production (`prod`)
- **Purpose**: Production deployment with full optimizations
- **Services**: Frontend, Backend, Database (PostgreSQL)
- **Features**:
  - Multi-stage Docker builds
  - Optimized images
  - Security hardening
  - Performance optimizations
- **Ports**:
  - Frontend: 80
  - Backend: 8000

## Common Commands

- Dev up: `./scripts/dev-up.sh` (or Compose dev file)
- UAT up: `docker compose -f deployment/docker/docker-compose.uat.yml up -d`
- Prod up: `docker compose -f deployment/docker/docker-compose.prod.yml up -d`
- Stop stacks: `./scripts/stop-stack.sh uat|prod`
- Clean: `./scripts/clean.sh [--stack dev|uat|prod] [--deep]`
- Tests: `./scripts/test-runner.sh backend|frontend|e2e|health|all`

## Prerequisites

The deployment script automatically checks for the following prerequisites:

- **Docker**: Container runtime
- **Docker Compose**: Multi-container orchestration
- **Git**: Version control
- **Python 3**: Backend runtime
- **Node.js**: Frontend runtime
- **npm**: Package manager

## Deployment Process

1. **Prerequisites Check**: Verify all required tools are installed
2. **Environment Cleanup** (if `--clean`): Remove old containers and images
3. **Test Execution** (if enabled): Run comprehensive test suite
4. **Service Build**: Build and start Docker containers
5. **Health Checks**: Verify all services are running correctly
6. **Build Info Update**: Update deployment metadata

## Database Migrations & Seeding

- **Alembic auto-run**: Backend commands in Compose prepend `alembic upgrade head` (see `deployment/docker/docker-compose.dev.yml`, `.uat.yml`, `.prod.yml`, and `deployment/standalone/docker-compose.yml`).
- **CI**: `.github/workflows/ci.yml` runs Alembic before backend tests and E2E startup.
- **Artifacts**: `.github/workflows/release-artifacts.yml` and `scripts/build-and-push-docker.sh` embed the migration step in generated Compose files.
- **Seeding is dev-only**: Use `./scripts/seed.sh` locally. Do not seed in UAT/Prod.
- **Local start**: Use `./scripts/dev-up.sh` or `./scripts/start-local.sh`.

If you encounter migration issues, ensure `DATABASE_URL` is correctly set for the target environment and that the database service is healthy before the backend starts.

## Health Checks

The deployment script performs health checks on:

- **Backend**: `http://localhost:8000/health`
- **Frontend**: `http://localhost:5173` (dev) or `http://localhost:80` (staging/prod)

## Error Handling

The deployment script includes comprehensive error handling:

- **Prerequisites failures**: Clear error messages for missing tools
- **Test failures**: Deployment aborts if tests fail
- **Build failures**: Detailed error reporting for Docker build issues
- **Health check failures**: Service-specific error messages
- **Timeout handling**: Commands timeout after configurable periods

## Logging

The deployment script provides detailed logging with:

- **Timestamps**: All log entries include timestamps
- **Log levels**: INFO, SUCCESS, ERROR, WARNING, etc.
- **Command tracking**: All executed commands are logged
- **Error details**: Full error messages and stack traces

## Rollback

Typical approach depends on image tags:

```bash
# Stop current stack (prod includes backup)
./scripts/stop-stack.sh prod

# Bring up previous tags (example)
IMAGE_TAG=v1.5.0 \
docker compose -f deployment/docker/docker-compose.prod.yml up -d --build
```

## Performance Optimizations

### Development Environment
- Fast startup times (< 30 seconds)
- Hot reloading for rapid development
- Minimal resource usage

### Production Environment
- Multi-stage Docker builds
- Optimized image sizes
- Cached layer builds
- Security hardening

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   Error: Docker is not running
   Solution: Start Docker Desktop or Docker daemon
   ```

2. **Port conflicts**
   ```
   Error: Port already in use
   Solution: Stop conflicting services or use different ports
   ```

3. **Insufficient disk space**
   ```
   Error: No space left on device
   Solution: Clean Docker images: docker system prune -a
   ```

4. **Memory issues**
   ```
   Error: Container killed due to memory limit
   Solution: Increase Docker memory limit or optimize application
   ```

### Debugging

```bash
docker compose -f deployment/docker/docker-compose.dev.yml ps
docker compose -f deployment/docker/docker-compose.dev.yml logs -f backend
docker compose -f deployment/docker/docker-compose.dev.yml logs -f frontend
```

## Migration from Old Scripts

Deprecated items (removed): `deploy.py`, root `docker-compose.yml`, legacy local-dev scripts. Use the commands in this document and in `docs/DEPLOYMENT.md`.

## Security Considerations

- **Image scanning**: All Docker images are scanned for vulnerabilities
- **Secret management**: Environment variables for sensitive data
- **Network isolation**: Services communicate over internal networks
- **Access control**: Production deployments require proper authentication

## Monitoring

### Health Monitoring
- Service health endpoints
- Docker container status
- Resource usage monitoring

### Log Monitoring
- Application logs
- Docker logs
- Deployment logs

## Support

For deployment issues:

1. Check the troubleshooting section
2. Review deployment logs
3. Verify prerequisites
4. Contact the development team

## Changelog

### Version 1.0.0 (Current)
- Consolidated deployment scripts
- Multi-environment support
- Comprehensive error handling
- Health check integration
- Performance optimizations
