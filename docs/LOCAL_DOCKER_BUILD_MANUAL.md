# Local Docker Build & Push Manual

## 🎯 Overview

This manual provides a complete guide for building and pushing Docker images locally when GitHub Actions workflows are failing. This approach gives you full control over the build process and allows you to create deployment packages without relying on CI/CD pipelines.

## 🏗️ Architecture

### Local Build Pipeline Components

1. **Build Scripts** (`scripts/`)
   - `build-and-push-docker.sh` - Complete build and push solution
   - `quick-docker-build.sh` - Simple build script
   - `setup-docker-env.sh` - Environment setup

2. **Docker Images**
   - Backend: FastAPI application
   - Frontend: React application
   - Database: PostgreSQL (external image)

3. **Deployment Packages**
   - Cross-platform startup scripts
   - Docker Compose configuration
   - User-friendly documentation

## 🚀 Quick Start Guide

### Prerequisites

1. **Docker Desktop** installed and running
2. **Docker Hub account** with login credentials
3. **Git** for version control
4. **Bash shell** (Windows users can use Git Bash or WSL)

### Step 1: Setup Environment

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Setup Docker environment
./scripts/setup-docker-env.sh
```

### Step 2: Configure Docker Hub

Edit the `.env` file with your Docker Hub credentials:

```bash
# Docker Hub Configuration
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password

# Application Configuration
VERSION=1.4.5
```

### Step 3: Build and Push

```bash
# Full build with deployment packages
./scripts/build-and-push-docker.sh 1.4.5 your-dockerhub-username

# Or quick build (simple)
./scripts/quick-docker-build.sh 1.4.5 your-dockerhub-username
```

## 📋 Detailed Instructions

### 1. Environment Setup

#### Docker Installation

**Windows/Mac:**
1. Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Install and start Docker Desktop
3. Verify installation: `docker --version`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

#### Docker Hub Login

```bash
# Interactive login
docker login

# Or using environment variables
export DOCKER_USERNAME=your-username
export DOCKER_PASSWORD=your-password
docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
```

### 2. Build Process

#### Full Build Script

The `build-and-push-docker.sh` script performs the following steps:

1. **Environment Validation**
   - Check Docker is running
   - Verify Docker Hub login
   - Validate version and username

2. **Backend Build**
   ```bash
   docker build \
     --platform linux/amd64,linux/arm64 \
     --target production \
     -t your-username/ipsc-backend:1.4.5 \
     -t your-username/ipsc-backend:latest \
     -f backend/Dockerfile \
     backend/
   ```

3. **Frontend Build**
   ```bash
   docker build \
     --platform linux/amd64,linux/arm64 \
     --target production \
     -t your-username/ipsc-frontend:1.4.5 \
     -t your-username/ipsc-frontend:latest \
     -f frontend/Dockerfile \
     frontend/
   ```

4. **Image Push**
   ```bash
   docker push your-username/ipsc-backend:1.4.5
   docker push your-username/ipsc-backend:latest
   docker push your-username/ipsc-frontend:1.4.5
   docker push your-username/ipsc-frontend:latest
   ```

5. **Deployment Package Creation**
   - Generate `docker-compose.yml`
   - Create startup scripts
   - Build documentation
   - Create compressed packages

#### Quick Build Script

For faster builds without deployment packages:

```bash
./scripts/quick-docker-build.sh 1.4.5 your-username
```

This script:
- Builds images locally
- Pushes to Docker Hub
- Skips deployment package creation

### 3. Manual Build Commands

If you prefer manual control:

```bash
# Login to Docker Hub
docker login

# Build backend
docker build -t your-username/ipsc-backend:1.4.5 -t your-username/ipsc-backend:latest backend/
docker push your-username/ipsc-backend:1.4.5
docker push your-username/ipsc-backend:latest

# Build frontend
docker build -t your-username/ipsc-frontend:1.4.5 -t your-username/ipsc-frontend:latest frontend/
docker push your-username/ipsc-frontend:1.4.5
docker push your-username/ipsc-frontend:latest
```

## 📦 Deployment Package Contents

### Generated Files

```
deployment-package/
├── docker-compose.yml    # Complete application stack
├── nginx.conf           # Reverse proxy configuration
├── start.sh             # Linux/Mac startup script
├── start.bat            # Windows startup script
├── stop.sh              # Linux/Mac stop script
├── stop.bat             # Windows stop script
└── README.md            # User instructions
```

### Compressed Packages

The build process creates three distribution formats:

1. **Windows Package**: `ipsc-v1.4.5-windows.zip`
2. **Linux/Mac Package**: `ipsc-v1.4.5-linux-mac.tar.gz`
3. **Universal Package**: `ipsc-v1.4.5-universal.tar.gz`

## 🔧 Configuration Options

### Environment Variables

```bash
# Docker Hub credentials
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password

# Application version
VERSION=1.4.5

# Build options
DOCKER_BUILDKIT=1
DOCKER_DEFAULT_PLATFORM=linux/amd64
```

### Build Arguments

```bash
# Multi-platform builds
--platform linux/amd64,linux/arm64

# Build targets
--target production

# Image tags
-t your-username/service:version
-t your-username/service:latest
```

## 🧪 Testing Your Builds

### Local Testing

```bash
# Test backend image
docker run -p 8000:8000 your-username/ipsc-backend:1.4.5

# Test frontend image
docker run -p 80:80 your-username/ipsc-frontend:1.4.5

# Test full stack
cd deployment-package
docker-compose up -d
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost

# Database health
docker exec ipsc-database pg_isready -U ipsc
```

### Log Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

## 🆘 Troubleshooting

### Common Issues

#### Docker Not Running
```bash
# Check Docker status
docker info

# Start Docker Desktop (Windows/Mac)
# Start Docker service (Linux)
sudo systemctl start docker
```

#### Docker Hub Login Issues
```bash
# Clear existing credentials
docker logout

# Login again
docker login

# Check login status
docker info | grep Username
```

#### Build Failures

**Backend Build Issues:**
```bash
# Check Python dependencies
cd backend
pip install -r requirements.txt

# Verify Dockerfile syntax
docker build --dry-run backend/
```

**Frontend Build Issues:**
```bash
# Check Node.js dependencies
cd frontend
npm install

# Verify Dockerfile syntax
docker build --dry-run frontend/
```

#### Push Failures

```bash
# Check Docker Hub permissions
docker push your-username/ipsc-backend:1.4.5

# Verify image exists locally
docker images | grep your-username

# Check network connectivity
ping registry-1.docker.io
```

### Performance Optimization

#### Build Caching
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Use build cache
docker build --cache-from your-username/ipsc-backend:latest backend/
```

#### Parallel Builds
```bash
# Build both images simultaneously
docker build -t your-username/ipsc-backend:1.4.5 backend/ &
docker build -t your-username/ipsc-frontend:1.4.5 frontend/ &
wait
```

## 📊 Monitoring and Logs

### Build Logs

```bash
# Verbose build output
docker build --progress=plain backend/

# Save build logs
docker build backend/ 2>&1 | tee build.log
```

### Push Logs

```bash
# Monitor push progress
docker push your-username/ipsc-backend:1.4.5 2>&1 | tee push.log
```

### System Resources

```bash
# Monitor Docker resources
docker system df

# Clean up unused resources
docker system prune -a
```

## 🔒 Security Considerations

### Docker Hub Security

1. **Use Access Tokens**: Instead of passwords, use Docker Hub access tokens
2. **Repository Permissions**: Ensure proper repository access permissions
3. **Image Scanning**: Scan images for vulnerabilities before pushing

### Local Security

1. **Environment Variables**: Store credentials in `.env` file (not in version control)
2. **Image Signing**: Sign images for authenticity verification
3. **Secrets Management**: Use Docker secrets for sensitive data

## 📈 Best Practices

### Version Management

1. **Semantic Versioning**: Use semantic versioning (MAJOR.MINOR.PATCH)
2. **Tag Strategy**: Always tag with both version and `latest`
3. **Version File**: Keep version in `VERSION` file

### Build Optimization

1. **Multi-stage Builds**: Use multi-stage builds for smaller images
2. **Layer Caching**: Optimize Dockerfile for better layer caching
3. **Base Images**: Use official, minimal base images

### Quality Assurance

1. **Pre-build Testing**: Run tests before building images
2. **Image Validation**: Verify image contents and functionality
3. **Documentation**: Keep build documentation updated

## 🔄 Automation

### Script Automation

```bash
# Automated build script
#!/bin/bash
VERSION=$(cat VERSION)
USERNAME=$(grep DOCKER_USERNAME .env | cut -d'=' -f2)

./scripts/build-and-push-docker.sh $VERSION $USERNAME
```

### CI/CD Integration

```yaml
# GitHub Actions fallback
- name: Local Build Fallback
  if: failure()
  run: |
    ./scripts/build-and-push-docker.sh ${{ github.ref_name }} ${{ secrets.DOCKER_USERNAME }}
```

## 📚 Additional Resources

### Documentation

- [Docker Build Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

### Tools

- **Docker Desktop**: GUI for Docker management
- **Docker CLI**: Command-line interface
- **Docker Compose**: Multi-container applications

### Community

- [Docker Community Forums](https://forums.docker.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/docker)
- [GitHub Issues](https://github.com/docker/docker/issues)

## 🎯 Success Metrics

### Build Success Rate
- **Target**: >95% successful builds
- **Measurement**: Track build failures and resolution time

### Push Success Rate
- **Target**: >99% successful pushes
- **Measurement**: Monitor Docker Hub connectivity and permissions

### User Adoption
- **Target**: >90% successful deployments
- **Measurement**: Track deployment package downloads and usage

## 🔄 Continuous Improvement

### Feedback Collection

1. **User Feedback**: Collect feedback from deployment package users
2. **Build Analytics**: Monitor build times and resource usage
3. **Error Tracking**: Track and analyze build failures

### Process Optimization

1. **Build Speed**: Optimize Dockerfile and build process
2. **Package Size**: Minimize deployment package size
3. **User Experience**: Improve startup scripts and documentation

---

*This manual provides a comprehensive guide for local Docker builds when CI/CD pipelines are unavailable. Regular updates ensure the process remains efficient and user-friendly.*
