@echo off
echo ========================================
echo    IPSC - Test Deployment
echo ========================================
echo.

REM Navigate to the project directory
cd /d "%~dp0"

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop for Windows
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo Testing IPSC deployment...
echo.

REM Start services if not running
echo Starting services...
docker-compose -f deployment/docker/docker-compose.dev.yml up -d

REM Wait for services to start
echo Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Check service status
echo.
echo Checking service status...
docker-compose -f deployment/docker/docker-compose.dev.yml ps

echo.
echo Testing health endpoints...

REM Test backend health
echo Testing backend health...
curl -s http://localhost:8000/health
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
)

echo.
echo Testing frontend...
curl -s -I http://localhost:5173 | findstr "200"
if %errorlevel% equ 0 (
    echo ✅ Frontend is accessible
) else (
    echo ❌ Frontend is not accessible
)

echo.
echo ========================================
echo    Deployment Test Complete!
echo ========================================
echo.
echo If all tests passed, the application is ready.
echo.
echo Access the application at:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000
echo.
pause
