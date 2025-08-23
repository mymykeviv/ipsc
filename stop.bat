@echo off
echo ========================================
echo    IPSC - Stopping Application
echo ========================================
echo.

REM Navigate to the project directory
cd /d "%~dp0"

echo Stopping Docker services...
docker-compose -f deployment/docker/docker-compose.dev.yml down

echo.
echo ========================================
echo    IPSC Application Stopped!
echo ========================================
echo.
echo All services have been stopped.
echo.
echo To start the application again, run: start.bat
echo.
pause
