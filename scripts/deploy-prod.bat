@echo off
REM ProfitPath Production Deployment Script for Windows (No Docker)
REM Sets up and deploys the application for production use
REM Usage: scripts\deploy-prod.bat [version]

setlocal enabledelayedexpansion

echo ========================================
echo    ProfitPath Production Deployment
echo    (Native - No Docker Required)
echo ========================================
echo.

REM Set version from parameter or default
set VERSION=%1
if "%VERSION%"=="" (
    if exist "VERSION" (
        set /p VERSION=<VERSION
        echo [INFO] Using version from VERSION file: !VERSION!
    ) else (
        set /p VERSION="Enter version (e.g., 1.0.0): "
    )
)

if "%VERSION%"=="" (
    echo ERROR: Version is required
    echo Usage: scripts\deploy-prod.bat [version]
    pause
    exit /b 1
)

echo Deploying ProfitPath v%VERSION% for production...
echo.

REM Check prerequisites
echo [INFO] Checking deployment prerequisites...

REM Check if we're in the right directory
if not exist "frontend" (
    echo ERROR: Frontend directory not found. Please run from project root.
    pause
    exit /b 1
)

if not exist "backend" (
    echo ERROR: Backend directory not found. Please run from project root.
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10+ from: https://python.org/
    pause
    exit /b 1
)
echo [OK] Python found
echo.

REM Stop any existing services
echo [INFO] Stopping any existing services...
if exist "scripts\stop-prod.bat" (
    call scripts\stop-prod.bat
) else (
    echo [WARNING] stop-prod.bat not found, continuing...
)
echo.

REM Build the application
echo [INFO] Building application for production...
echo ========================================

if exist "scripts\build-prod.bat" (
    call scripts\build-prod.bat %VERSION%
    if %errorlevel% neq 0 (
        echo ERROR: Production build failed
        pause
        exit /b 1
    )
) else (
    echo ERROR: build-prod.bat not found
    pause
    exit /b 1
)

echo [OK] Application built successfully
echo.

REM Setup production environment
echo [INFO] Setting up production environment...
echo ========================================

REM Create production directories
if not exist "logs" mkdir logs
if not exist "data" mkdir data
if not exist "backups" mkdir backups

echo [INFO] Created production directories

REM Setup environment variables
echo [INFO] Setting up environment variables...

REM Create production environment file for backend
echo # ProfitPath Production Environment > backend\.env.production
echo ENVIRONMENT=production >> backend\.env.production
echo DEBUG=false >> backend\.env.production
echo LOG_LEVEL=INFO >> backend\.env.production
echo HOST=0.0.0.0 >> backend\.env.production
echo PORT=8000 >> backend\.env.production
echo # Database configuration (update as needed) >> backend\.env.production
echo DATABASE_URL=sqlite:///./data/profitpath.db >> backend\.env.production
echo # Security settings >> backend\.env.production
echo SECRET_KEY=your-secret-key-here-change-in-production >> backend\.env.production
echo CORS_ORIGINS=http://localhost:4173,http://127.0.0.1:4173 >> backend\.env.production

echo [INFO] Created backend production environment file

REM Create production environment file for frontend
echo # ProfitPath Frontend Production Environment > frontend\.env.production
echo VITE_APP_ENV=production >> frontend\.env.production
echo VITE_API_BASE_URL=http://localhost:8000 >> frontend\.env.production
echo VITE_APP_TITLE=ProfitPath >> frontend\.env.production
echo VITE_APP_VERSION=%VERSION% >> frontend\.env.production

echo [INFO] Created frontend production environment file
echo.

REM Database setup
echo [INFO] Setting up production database...
echo ========================================

cd backend
call venv\Scripts\activate.bat

REM Run database migrations
echo [INFO] Running database migrations...
set ENVIRONMENT=production
python -m alembic upgrade head
if %errorlevel% neq 0 (
    echo WARNING: Database migrations failed or not configured
    echo Please ensure your database is properly configured
)

cd ..
echo [OK] Database setup completed
echo.

REM Create deployment info
echo [INFO] Creating deployment information...
echo Deployment Date: %date% %time% > deployment-info.txt
echo Version: %VERSION% >> deployment-info.txt
echo Deployment Type: Native Production >> deployment-info.txt
echo Frontend: Built to frontend/dist/ >> deployment-info.txt
echo Backend: Virtual environment in backend/venv/ >> deployment-info.txt
echo Environment Files: Created >> deployment-info.txt
echo Database: Migrations applied >> deployment-info.txt
echo.

REM Start services
echo [INFO] Starting production services...
echo ========================================

if exist "scripts\start-prod.bat" (
    echo [INFO] Starting services with start-prod.bat...
    call scripts\start-prod.bat
) else (
    echo ERROR: start-prod.bat not found
    echo Please run scripts\start-prod.bat manually to start services
)

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo Version: %VERSION%
echo Status: Production deployment completed
echo.
echo Services:
echo - Backend API: http://localhost:8000
echo - Frontend App: http://localhost:4173
echo - API Documentation: http://localhost:8000/docs
echo.
echo Management:
echo - Start: scripts\start-prod.bat
echo - Stop: scripts\stop-prod.bat
echo - Rebuild: scripts\build-prod.bat
echo.
echo IMPORTANT: Please update the following before going live:
echo 1. Change SECRET_KEY in backend\.env.production
echo 2. Configure proper database connection
echo 3. Update CORS_ORIGINS for your domain
echo 4. Review and update all environment variables
echo.
echo Deployment completed successfully!
pause