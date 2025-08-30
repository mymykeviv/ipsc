# Production Deployment Guide (Native - No Docker)

This guide covers deploying ProfitPath in production mode using native tools without Docker containers.

## Overview

The production deployment uses native Node.js and Python installations to run the application, providing better performance and easier debugging compared to containerized deployments.

## Prerequisites

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **Python 3.10+**: Download from [python.org](https://python.org/)
- **Git**: For version control
- **Windows**: These scripts are designed for Windows environments

## Quick Start

1. **Build for Production**:
   ```bash
   scripts\build-prod.bat 1.0.0
   ```

2. **Deploy to Production**:
   ```bash
   scripts\deploy-prod.bat 1.0.0
   ```

3. **Start Services**:
   ```bash
   scripts\start-prod.bat
   ```

4. **Stop Services**:
   ```bash
   scripts\stop-prod.bat
   ```

## Available Scripts

### build-prod.bat

Builds the application for production deployment using native tools.

**Usage**: `scripts\build-prod.bat [version]`

**What it does**:
- Checks prerequisites (Node.js, Python, pip)
- Installs frontend dependencies with `npm ci`
- Runs frontend type checking and linting
- Builds frontend production bundle to `frontend/dist/`
- Creates Python virtual environment in `backend/venv/`
- Installs backend dependencies
- Runs backend tests
- Compiles Python bytecode
- Creates version and build information files

### start-prod.bat

Starts the production services using native builds.

**Usage**: `scripts\start-prod.bat`

**What it does**:
- Validates that production builds exist
- Checks port availability (8000 for backend, 4173 for frontend)
- Starts FastAPI backend server on port 8000
- Starts Vite preview server for frontend on port 4173
- Opens the application in your default browser

**Services**:
- Backend API: http://localhost:8000
- Frontend App: http://localhost:4173
- API Documentation: http://localhost:8000/docs

### stop-prod.bat

Gracefully stops all production services.

**Usage**: `scripts\stop-prod.bat`

**What it does**:
- Stops backend service (port 8000)
- Stops frontend service (port 4173)
- Terminates related Python and Node.js processes
- Closes service windows
- Verifies ports are freed

### deploy-prod.bat

Complete deployment script that builds, configures, and starts the application.

**Usage**: `scripts\deploy-prod.bat [version]`

**What it does**:
- Stops existing services
- Builds the application
- Creates production directories (`logs/`, `data/`, `backups/`)
- Sets up environment files
- Runs database migrations
- Starts production services
- Creates deployment information

## Directory Structure

After building and deploying:

```
ProfitPath/
├── frontend/
│   ├── dist/                 # Production frontend build
│   └── .env.production       # Frontend environment config
├── backend/
│   ├── venv/                 # Python virtual environment
│   └── .env.production       # Backend environment config
├── logs/                     # Application logs
├── data/                     # Database and data files
├── backups/                  # Backup files
├── VERSION                   # Current version
├── build-info.txt           # Build information
└── deployment-info.txt      # Deployment information
```

## Environment Configuration

### Backend Environment (.env.production)

```env
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite:///./data/profitpath.db
SECRET_KEY=your-secret-key-here-change-in-production
CORS_ORIGINS=http://localhost:4173,http://127.0.0.1:4173
```

### Frontend Environment (.env.production)

```env
VITE_APP_ENV=production
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=ProfitPath
VITE_APP_VERSION=1.0.0
```

## Security Considerations

**IMPORTANT**: Before going live, update the following:

1. **Change SECRET_KEY** in `backend/.env.production`
2. **Configure proper database** connection (replace SQLite for production)
3. **Update CORS_ORIGINS** for your domain
4. **Review all environment variables**
5. **Set up proper SSL/TLS** certificates
6. **Configure firewall** rules
7. **Set up monitoring** and logging

## Database Setup

The deployment script automatically:
- Creates a `data/` directory
- Runs Alembic migrations
- Sets up SQLite database (for development)

For production, consider:
- PostgreSQL or MySQL for better performance
- Regular database backups
- Connection pooling
- Read replicas for scaling

## Monitoring and Logs

- **Backend logs**: Check "ProfitPath Backend" window
- **Frontend logs**: Check "ProfitPath Frontend" window
- **Application logs**: `logs/` directory
- **Health check**: http://localhost:8000/health

## Troubleshooting

### Port Already in Use
```bash
# Stop existing services
scripts\stop-prod.bat

# Check what's using the ports
netstat -an | findstr ":8000"
netstat -an | findstr ":4173"
```

### Build Failures
```bash
# Clean and rebuild
rmdir /s frontend\node_modules
rmdir /s backend\venv
scripts\build-prod.bat 1.0.0
```

### Database Issues
```bash
# Reset database (WARNING: This deletes all data)
del data\profitpath.db
scripts\deploy-prod.bat 1.0.0
```

### Service Won't Start
1. Check prerequisites are installed
2. Verify builds exist (`frontend/dist/`, `backend/venv/`)
3. Check port availability
4. Review environment files
5. Check logs for errors

## Performance Optimization

### Frontend
- Static files are pre-built and optimized
- Vite preview server handles compression
- Consider using a reverse proxy (nginx) for production

### Backend
- Python bytecode is pre-compiled
- Virtual environment isolates dependencies
- Consider using Gunicorn with multiple workers
- Set up database connection pooling

## Scaling Considerations

### Horizontal Scaling
- Run multiple backend instances behind a load balancer
- Use a shared database
- Implement session storage (Redis)

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use caching (Redis/Memcached)

## Backup and Recovery

### Automated Backups
```bash
# Database backup
copy data\profitpath.db backups\profitpath_%date%.db

# Full application backup
xcopy /E /I . backups\full_%date%
```

### Recovery
1. Stop services: `scripts\stop-prod.bat`
2. Restore database from backup
3. Restore application files if needed
4. Start services: `scripts\start-prod.bat`

## Migration from Docker

If migrating from Docker deployment:

1. **Export data** from Docker containers
2. **Stop Docker services**
3. **Run native build**: `scripts\build-prod.bat`
4. **Import data** to native deployment
5. **Start native services**: `scripts\start-prod.bat`

## Support

For issues with production deployment:
1. Check this documentation
2. Review application logs
3. Verify environment configuration
4. Check system requirements
5. Contact development team

---

**Note**: This deployment method is optimized for Windows environments. For Linux/macOS, consider adapting the scripts or using the Docker deployment method.