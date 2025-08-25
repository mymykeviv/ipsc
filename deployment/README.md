# Cashflow Deployment Documentation

## Overview

This directory contains the consolidated deployment system for Cashflow (Invoice Processing & Stock Control). The new system replaces the previous three separate deployment scripts with a single, well-documented approach that supports multiple environments.

## Quick Start

### Development Environment
```bash
# Deploy to development environment
python deployment/deploy.py dev

# Deploy with clean build
python deployment/deploy.py dev --clean

# Deploy without running tests
python deployment/deploy.py dev --skip-tests
```

### Production Environment
```bash
# Deploy to production with tests
python deployment/deploy.py prod --test

# Deploy to production with clean build
python deployment/deploy.py prod --clean
```

### Staging Environment
```bash
# Deploy to staging
python deployment/deploy.py staging

# Deploy to staging with clean build
python deployment/deploy.py staging --clean
```

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

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `environment` | Target environment (dev/staging/prod) | `python deployment/deploy.py dev` |
| `--clean` | Clean build (remove containers and images) | `python deployment/deploy.py dev --clean` |
| `--test` | Run tests before deployment | `python deployment/deploy.py prod --test` |
| `--skip-tests` | Skip test execution | `python deployment/deploy.py dev --skip-tests` |
| `--rollback` | Rollback to previous deployment | `python deployment/deploy.py prod --rollback` |
| `--help` | Show help message | `python deployment/deploy.py --help` |

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

- **Alembic migrations auto-run**: The backend now runs `alembic upgrade head` before starting the API in all Compose profiles (`dev`, `uat/staging`, `prod`) and in CI jobs where the backend is started. This aligns deployments with the new single baseline migration.
- **Startup locations updated**:
  - Docker Compose: `deployment/docker/docker-compose.dev.yml`, `deployment/docker/docker-compose.uat.yml`, `deployment/docker/docker-compose.prod.yml`, `deployment/standalone/docker-compose.yml`, and root `docker-compose.yml` all prepend the Alembic upgrade to the backend command.
  - CI: `.github/workflows/ci.yml` runs Alembic before backend tests and before e2e backend startup.
  - Artifact generation: `.github/workflows/release-artifacts.yml` and `scripts/build-and-push-docker.sh` embed the migration step in generated Compose files.
- **Seeding is dev-only**: Any data seeding or sample data steps should run only in development. Staging/UAT and Production environments must not seed data automatically.
- **Local scripts**: `scripts/local-dev.sh` and `scripts/local-dev-clean.sh` run Alembic migrations before launching the dev server.

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

Rollback functionality is available for production deployments:

```bash
# Rollback production deployment
python deployment/deploy.py prod --rollback
```

**Note**: Rollback functionality is currently under development.

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

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment variable
export DEPLOY_DEBUG=1
python deployment/deploy.py dev
```

## Migration from Old Scripts

### Old Scripts (Deprecated)
- `deploy.py` - Python-based deployment
- `deploy.sh` - Shell-based deployment  
- `scripts/deploy-dev.sh` - Development-specific deployment

### Migration Steps
1. **Backup**: Create backup of current deployment
2. **Test**: Test new deployment script in development
3. **Deploy**: Use new script for all environments
4. **Cleanup**: Remove old scripts after validation

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
