# ProfitPath Build and Package Guide

This guide explains how to properly build and package ProfitPath for deployment on Windows systems.

## Overview

ProfitPath uses a two-step process to create deployable packages:
1. **Build**: Compile frontend and backend components
2. **Package**: Create an offline installer with all dependencies

## Quick Start

### One-Step Build and Package
```bash
# Build and package in one command
scripts\build-and-package.bat 1.5.2
```

### Manual Two-Step Process
```bash
# Step 1: Build the application
scripts\build-prod.bat

# Step 2: Create offline installer
scripts\create-offline-installer.bat 1.5.2
```

## Scripts Overview

### 1. `build-prod.bat`
**Purpose**: Builds the application for production

**What it does**:
- Checks for Node.js and Python prerequisites
- Updates VERSION file
- Cleans and rebuilds frontend (`npm install` + `npm run build`)
- Creates Python virtual environment
- Installs Python dependencies
- Compiles Python bytecode
- Creates build information files

**Output**:
- `frontend/dist/` - Built frontend assets
- `backend/venv/` - Python virtual environment with dependencies
- `VERSION` - Version information
- `build-info.txt` - Build metadata

### 2. `create-offline-installer.bat`
**Purpose**: Creates a complete offline installer package

**What it does**:
- Validates that build artifacts exist
- Copies application files (frontend/backend/scripts/config)
- Downloads all Python dependencies for offline installation
- Creates installer scripts (`install.bat`, `uninstall.bat`)
- Generates comprehensive README with installation instructions
- Packages everything into a ZIP file

**Output**:
- `ProfitPath-v{VERSION}-Windows-Offline-Installer.zip` - Complete installer package
- `ProfitPath-v{VERSION}-Windows-Offline/` - Temporary installer directory

### 3. `build-and-package.bat` (New)
**Purpose**: Combines both steps for convenience

**What it does**:
- Runs `build-prod.bat`
- Runs `create-offline-installer.bat`
- Provides unified error handling and progress reporting

## Package Contents

The generated installer package includes:

```
ProfitPath-v{VERSION}-Windows-Offline-Installer.zip
├── install.bat                 # Main installer script
├── uninstall.bat              # Uninstaller script
├── README.txt                 # Installation instructions
├── VERSION                    # Version information
├── build-info.json           # Build metadata
├── health-status.json         # Health check configuration
├── README.md                  # Project documentation
├── frontend/
│   ├── dist/                  # Built frontend assets
│   ├── package.json          # Frontend dependencies
│   └── package-lock.json     # Locked dependency versions
├── backend/
│   ├── app/                   # Backend application code
│   ├── migrations/            # Database migrations
│   ├── requirements-frozen.txt # Exact Python dependencies
│   └── *.py, *.txt, *.ini    # Backend configuration files
├── scripts/
│   ├── start-prod.bat        # Production startup script
│   ├── stop-prod.bat         # Production shutdown script
│   └── build-prod.bat        # Build script (for reference)
├── python-packages/           # All Python dependencies (offline)
│   └── *.whl                 # Python wheel files
└── config/                    # Application configuration
    └── ports.json            # Port configuration
```

## Installation Process

The installer package works completely offline:

1. **Extract**: User extracts the ZIP file
2. **Install**: User runs `install.bat` as administrator
3. **Setup**: Installer creates virtual environment and installs dependencies from local packages
4. **Configure**: Creates desktop shortcuts and start menu entries
5. **Ready**: Application is ready to run

## Prerequisites

### For Building
- Windows 10 or later
- Node.js 18+ (for frontend build)
- Python 3.8+ (for backend build)
- Git (for version information)

### For Target Systems (Installation)
- Windows 10 or later
- Python 3.8+ (must be installed separately)
- Administrator privileges
- 2GB+ free disk space

## Troubleshooting

### Build Issues

**Frontend build fails**:
- Ensure Node.js 18+ is installed
- Check `frontend/package.json` for dependency issues
- Clear `node_modules` and `package-lock.json`, then rebuild

**Backend build fails**:
- Ensure Python 3.8+ is installed and in PATH
- Check `backend/requirements.txt` for dependency conflicts
- Verify virtual environment creation permissions

**TypeScript compilation issues**:
- Check `frontend/tsconfig.json` configuration
- Ensure all TypeScript files have correct syntax
- Verify `@types/*` packages are installed

### Packaging Issues

**Missing build artifacts**:
- Run `build-prod.bat` first
- Verify `frontend/dist/` and `backend/venv/` exist

**Python package download fails**:
- Check internet connection
- Verify `backend/requirements.txt` is valid
- Ensure pip is up to date

**ZIP creation fails**:
- Check available disk space
- Verify write permissions in project directory
- Ensure no files are locked by other processes

### Installation Issues

**Installer requires administrator**:
- Right-click `install.bat` and select "Run as administrator"
- Check Windows UAC settings

**Python not found during installation**:
- Install Python 3.8+ from python.org
- Ensure "Add Python to PATH" is checked during installation
- Restart command prompt after Python installation

**Port conflicts**:
- Ensure ports 4173 and 8000 are not in use
- Check Windows Firewall settings
- Modify `config/ports.json` if needed

## Best Practices

1. **Version Management**: Always specify a version when building
2. **Testing**: Test installer packages on clean systems before distribution
3. **Documentation**: Update version numbers in documentation when releasing
4. **Backup**: Keep installer packages for rollback purposes
5. **Validation**: Verify package contents before distribution

## Version History

- **v1.5.2**: Current version with offline installer support
- **v1.5.1**: Previous version
- **v1.5.0**: Major release with packaging improvements

## Related Documentation

- [Local Development Guide](LOCAL_DEVELOPMENT.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Testing Guide](TESTING.md)
- [Architecture Overview](ARCHITECTURE.md)