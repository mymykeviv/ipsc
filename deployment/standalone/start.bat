@echo off
echo.
echo ========================================
echo    ProfitPath - Starting Application...
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker is not running!
  echo Please start Docker Desktop and try again.
  echo.
  pause
  exit /b 1
)

echo Docker is running. Starting services...
echo.

REM Pull latest images
echo Downloading latest application files...
docker-compose pull

REM Start services
echo Starting ProfitPath services...
docker-compose up -d

REM Wait for services
echo.
echo Waiting for services to start (this may take a few minutes)...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo.
echo Checking if services are ready...

REM Try to check backend health
curl -f http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
  echo WARNING: Backend is still starting up...
) else (
  echo ✓ Backend is ready
)

REM Try to check frontend
curl -f http://localhost:80 >nul 2>&1
if errorlevel 1 (
  echo WARNING: Frontend is still starting up...
) else (
  echo ✓ Frontend is ready
)

echo.
echo ========================================
echo    🎉 ProfitPath is starting up!
echo ========================================
echo.
echo 📱 Open your web browser and go to:
echo    http://localhost
echo.
echo 🔧 Backend API: http://localhost:8000
echo 🗄️  Database: localhost:5432
echo.
echo 💡 Default login:
echo    Username: admin
echo    Password: admin123
echo.
echo ⏳ If the page doesn't load immediately,
echo    wait a few more minutes for all services
echo    to fully start up.
echo.
echo ========================================
echo.
echo Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop: docker-compose down
echo   Restart: docker-compose restart
echo.
pause
