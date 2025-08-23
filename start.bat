@echo off
echo ========================================
echo    IPSC - Invoice & Purchase System
echo    for Cashflow - Windows Launcher
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop for Windows
    echo Download from: https://www.docker.com/products/docker-desktop
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

echo Starting IPSC application...
echo.

REM Navigate to the project directory
cd /d "%~dp0"

REM Start the development environment
echo Starting Docker services...
docker-compose -f deployment/docker/docker-compose.dev.yml up -d

REM Wait for services to start
echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service status
echo.
echo Checking service status...
docker-compose -f deployment/docker/docker-compose.dev.yml ps

echo.
echo ========================================
echo    IPSC Application Started!
echo ========================================
echo.
echo Access the application at:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000
echo   MailHog: http://localhost:8025
echo.
echo Health Check: http://localhost:8000/health
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open the application in default browser
start http://localhost:5173

echo.
echo Application opened in browser!
echo.
echo To stop the application, run: stop.bat
echo.
pause
