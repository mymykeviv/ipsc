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

REM Create logs directory
if not exist "logs" mkdir logs

REM Check if services are already running
echo [INFO] Checking for existing services...
netstat -an | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 8000 is already in use (Backend API)
    echo Please stop existing services or use scripts\stop-prod.bat
    pause
    exit /b 1
)

netstat -an | findstr ":4173" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 4173 is already in use (Frontend Preview)
    echo Please stop existing services or use scripts\stop-prod.bat
    pause
    exit /b 1
)

echo [OK] Ports are available
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

echo [INFO] Starting FastAPI server on port 8000...
start "ProfitPath Backend" cmd /k "title ProfitPath Backend ^& python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info"

cd ..
echo [OK] Backend service started
echo.

REM Wait for backend to start
echo [INFO] Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Test backend health
echo [INFO] Testing backend health...
curl -s http://localhost:8000/health >nul 2>&1
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
echo [INFO] Starting production preview server on port 4173...
start "ProfitPath Frontend" cmd /k "title ProfitPath Frontend ^& npx vite preview --host 0.0.0.0 --port 4173"

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
echo - Backend API: http://localhost:8000
echo - Frontend App: http://localhost:4173
echo - API Documentation: http://localhost:8000/docs
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
start http://localhost:4173

echo Application opened in browser.
echo Services are running in separate windows.
echo.