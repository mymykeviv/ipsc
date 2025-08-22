@echo off
echo.
echo ========================================
echo    ProfitPath - Deployment Test
echo ========================================
echo.

REM Check if docker-compose is running
echo Checking if services are running...
docker-compose ps | findstr "Up" >nul 2>&1
if errorlevel 1 (
  echo ERROR: No services are running. Please start the application first.
  pause
  exit /b 1
)

echo ✓ Services are running

REM Test database connection
echo.
echo Testing database connection...
docker-compose exec -T database pg_isready -U profitpath >nul 2>&1
if errorlevel 1 (
  echo ERROR: Database is not accessible
) else (
  echo ✓ Database is accessible
)

REM Test backend API
echo.
echo Testing backend API...
curl -f http://localhost/api/health >nul 2>&1
if errorlevel 1 (
  echo ERROR: Backend API is not responding
) else (
  echo ✓ Backend API is responding
)

REM Test frontend via nginx
echo.
echo Testing frontend application...
curl -f http://localhost >nul 2>&1
if errorlevel 1 (
  echo ERROR: Frontend is not accessible
) else (
  echo ✓ Frontend is accessible
)

REM Test nginx health endpoint
echo.
echo Testing nginx reverse proxy...
curl -f http://localhost/health >nul 2>&1
if errorlevel 1 (
  echo ERROR: Nginx is not working correctly
) else (
  echo ✓ Nginx is working correctly
)

REM Test MailHog
echo.
echo Testing MailHog email service...
curl -f http://localhost:8025 >nul 2>&1
if errorlevel 1 (
  echo ERROR: MailHog is not accessible
) else (
  echo ✓ MailHog is accessible
)

REM Test API endpoints
echo.
echo Testing API endpoints...

REM Test authentication endpoint
curl -f http://localhost/api/auth/login >nul 2>&1
if errorlevel 1 (
  echo WARNING: Authentication endpoint may not be working
) else (
  echo ✓ Authentication endpoint is working
)

REM Test health endpoint with response
echo.
echo Health check details:
for /f "delims=" %%i in ('curl -s http://localhost/api/health 2^>nul') do set HEALTH_RESPONSE=%%i
if not "%HEALTH_RESPONSE%"=="" (
  echo    Backend health: %HEALTH_RESPONSE%
) else (
  echo WARNING: Could not get health response
)

REM Check container status
echo.
echo Container status:
docker-compose ps

REM Check resource usage
echo.
echo Resource usage:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo.
echo ========================================
echo    Deployment test completed!
echo ========================================
echo.
echo Access your application at:
echo    http://localhost
echo.
echo Access MailHog at:
echo    http://localhost:8025
echo.
echo If you see any errors above, check the logs:
echo    docker-compose logs -f
echo.
pause
