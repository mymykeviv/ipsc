@echo off
REM ProfitPath Production Start Script for Windows (No Docker)
REM Starts frontend and backend services using native builds
REM Usage: scripts\start-prod.bat

setlocal enabledelayedexpansion

echo ========================================
echo    ProfitPath Production Start
echo    (Native - No Docker Required)
echo ========================================
echo.

REM Check if build exists
if not exist "frontend\dist" (
    echo ERROR: Frontend build not found. Please run scripts\build-prod.bat first
    pause
    exit /b 1
)

if not exist "backend\venv" (
    echo ERROR: Backend virtual environment not found. Please run scripts\build-prod.bat first
    pause
    exit /b 1
)

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check Python (try python first, then py)
set PYTHON_CMD=
python --version >nul 2>&1
if !errorlevel! equ 0 (
    set PYTHON_CMD=python
) else (
    py --version >nul 2>&1
    if !errorlevel! equ 0 (
        set PYTHON_CMD=py
    ) else (
        echo ERROR: Python is not installed or not in PATH
        echo Please install Python 3.10+ from: https://python.org/
        pause
        exit /b 1
    )
)
echo [OK] Python found (!PYTHON_CMD!)
echo.

REM Create logs directory
if not exist "logs" mkdir logs

REM Load port configuration
echo [INFO] Loading port configuration...
if not exist "config\ports.json" (
    echo ERROR: Port configuration file not found: config\ports.json
    echo Please ensure the configuration file exists.
    pause
    exit /b 1
)

REM Parse JSON config using PowerShell (simple approach)
for /f "tokens=*" %%i in ('powershell -Command "(Get-Content 'config\ports.json' | ConvertFrom-Json).backend.port"') do set BACKEND_PORT=%%i
for /f "tokens=*" %%i in ('powershell -Command "(Get-Content 'config\ports.json' | ConvertFrom-Json).frontend.port"') do set FRONTEND_PORT=%%i

echo [INFO] Backend port: !BACKEND_PORT!
echo [INFO] Frontend port: !FRONTEND_PORT!

REM Simple port availability check
echo [INFO] Checking port availability...
netstat -an | findstr ":!BACKEND_PORT!" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   PORT CONFLICT DETECTED
    echo ========================================
    echo Backend port !BACKEND_PORT! is already in use.
    echo.
    echo To resolve this:
    echo 1. Edit config\ports.json to change the backend port
    echo 2. Or stop the service using that port
    echo 3. Then run this script again
    echo.
    pause
    exit /b 1
)

netstat -an | findstr ":!FRONTEND_PORT!" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   PORT CONFLICT DETECTED
    echo ========================================
    echo Frontend port !FRONTEND_PORT! is already in use.
    echo.
    echo To resolve this:
    echo 1. Edit config\ports.json to change the frontend port
    echo 2. Or stop the service using that port
    echo 3. Then run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Ports !BACKEND_PORT! and !FRONTEND_PORT! are available
echo.

REM Start backend service
echo [INFO] Starting backend service...
echo ========================================

cd backend
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Setting production environment...
set ENVIRONMENT=production
set PYTHONPATH=%cd%

echo [INFO] Starting FastAPI server on port !BACKEND_PORT!...
start "ProfitPath Backend" cmd /k "title ProfitPath Backend ^& !PYTHON_CMD! -m uvicorn app.main:app --host 0.0.0.0 --port !BACKEND_PORT! --workers 1 --log-level info"

cd ..
echo [OK] Backend service started
echo.

REM Wait for backend to start
echo [INFO] Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Test backend health
echo [INFO] Testing backend health...
curl -s http://localhost:!BACKEND_PORT!/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is responding
) else (
    echo [WARNING] Backend may still be starting up
)
echo.

REM Start frontend service
echo [INFO] Starting frontend service...
echo ========================================

cd frontend
echo [INFO] Starting production preview server on port !FRONTEND_PORT!...
start "ProfitPath Frontend" cmd /k "title ProfitPath Frontend ^& npx vite preview --host 0.0.0.0 --port !FRONTEND_PORT!"

cd ..
echo [OK] Frontend service started
echo.

REM Wait for frontend to start
echo [INFO] Waiting for frontend to start...
timeout /t 3 /nobreak >nul

echo ========================================
echo    Production Services Started!
echo ========================================
echo.
echo Services:
echo - Backend API: http://localhost:!BACKEND_PORT!
echo - Frontend App: http://localhost:!FRONTEND_PORT!
echo - API Documentation: http://localhost:!BACKEND_PORT!/docs
echo.
echo Logs:
echo - Backend: Check "ProfitPath Backend" window
echo - Frontend: Check "ProfitPath Frontend" window
echo.
echo To stop services: scripts\stop-prod.bat
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open application in browser
start http://localhost:!FRONTEND_PORT!

echo Application opened in browser.
echo Services are running in separate windows.
echo.