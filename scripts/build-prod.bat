@echo off
REM ProfitPath Production Build Script for Windows (No Docker)
REM Builds frontend and backend for production deployment using native tools
REM Usage: scripts\build-prod.bat [version]

setlocal enabledelayedexpansion

echo ========================================
echo    ProfitPath Production Build
echo    (Native - No Docker Required)
echo ========================================
echo.

REM Set version from parameter or default
set VERSION=%1
if "%VERSION%"=="" (
    set /p VERSION="Enter version (e.g., 1.0.0): "
)

if "%VERSION%"=="" (
    echo ERROR: Version is required
    echo Usage: scripts\build-prod.bat [version]
    pause
    exit /b 1
)

echo Building ProfitPath v%VERSION% for production (native build)...
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js (required)
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check Python (required)
py --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10+ from: https://python.org/
    pause
    exit /b 1
)
echo [OK] Python found

REM Check pip
py -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pip is not installed or not in PATH
    echo Please ensure pip is installed with Python
    pause
    exit /b 1
)
echo [OK] pip found
echo.

REM Navigate to project root
cd /d "%~dp0\.."

REM Update VERSION file
echo [INFO] Updating VERSION file...
echo %VERSION% > VERSION
echo [OK] VERSION file updated
echo.

REM Build frontend
echo [INFO] Building frontend for production...
echo ========================================

echo [INFO] Building frontend natively...
cd frontend

echo [INFO] Cleaning existing node_modules and package-lock.json...
if exist node_modules (
    echo [INFO] Removing existing node_modules directory...
    rmdir /s /q node_modules
    if %errorlevel% neq 0 (
        echo [WARNING] Could not fully remove node_modules, attempting force cleanup...
        timeout /t 2 /nobreak >nul
        rmdir /s /q node_modules 2>nul
    )
)
if exist package-lock.json (
    echo [INFO] Removing package-lock.json to fix optional dependency issues...
    del package-lock.json
)

echo [INFO] Installing frontend dependencies with optional dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [WARNING] npm install failed, trying with cache clean...
    call npm cache clean --force
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
)

echo [INFO] Building frontend production bundle...
set VITE_APP_ENV=production
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    cd ..
    pause
    exit /b 1
)

cd ..
echo [OK] Frontend built successfully (dist/ folder created)

echo.

REM Build backend
echo [INFO] Building backend for production...
echo ========================================

echo [INFO] Building backend natively...
cd backend

echo [INFO] Creating virtual environment...
py -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    cd ..
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Upgrading pip...
py -m pip install --upgrade pip

echo [INFO] Installing backend dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)

echo [INFO] Installing production dependencies...
if exist requirements-prod.txt (
    pip install -r requirements-prod.txt
    if %errorlevel% neq 0 (
        echo WARNING: Failed to install some production dependencies
    )
)

echo [INFO] Compiling Python bytecode...
py -m compileall . -q

cd ..
echo [OK] Backend prepared successfully (virtual environment created)
echo.

REM Create version file
echo [INFO] Creating version file...
echo %VERSION% > VERSION
echo [OK] Version file created
echo.

REM Create production build info
echo [INFO] Creating build information...
echo Build Date: %date% %time% > build-info.txt
echo Version: %VERSION% >> build-info.txt
echo Build Type: Native (No Docker) >> build-info.txt
echo Frontend: Built to frontend/dist/ >> build-info.txt
echo Backend: Virtual environment in backend/venv/ >> build-info.txt
echo [OK] Build information created
echo.

echo ========================================
echo    Build Complete!
echo ========================================
echo Version: %VERSION%
echo Frontend: Built to frontend/dist/ folder
echo Backend: Virtual environment ready in backend/venv/
echo.
echo To start production services:
echo 1. Run: scripts\start-prod.bat
echo 2. Or manually activate backend/venv and run services
echo.
echo Build completed successfully!
pause