@echo off
setlocal enabledelayedexpansion

REM Parse arguments for mode (dev, prod, or both)
set MODE=%1
if "%1"=="--help" (
    echo Usage: stop-local.bat [dev^|prod]
    echo   dev  - Stop development mode processes
    echo   prod - Stop production mode processes
    echo   (no argument) - Stop both dev and prod processes
    exit /b 0
)

if "%MODE%"=="" (
    echo [INFO] Stopping all local processes...
) else (
    echo [INFO] Stopping local %MODE% processes...
)

REM Kill processes on specific ports
echo [INFO] Stopping processes on port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo [INFO] Stopping processes on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill uvicorn processes
echo [INFO] Stopping uvicorn processes...
taskkill /IM python.exe /F >nul 2>&1
taskkill /IM uvicorn.exe /F >nul 2>&1

REM Kill npm/node processes
echo [INFO] Stopping npm/node processes...
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM npm.cmd /F >nul 2>&1

REM Close command windows with specific titles
echo [INFO] Closing development server windows...
if "%MODE%"=="" (
    taskkill /FI "WINDOWTITLE eq Backend API*" /F >nul 2>&1
    taskkill /FI "WINDOWTITLE eq Frontend Dev Server*" /F >nul 2>&1
) else (
    taskkill /FI "WINDOWTITLE eq Backend API (%MODE%)*" /F >nul 2>&1
    taskkill /FI "WINDOWTITLE eq Frontend Dev Server (%MODE%)*" /F >nul 2>&1
)

REM Remove PID files
if "%MODE%"=="" (
    if exist ".local-dev.pid" (
        del ".local-dev.pid"
        echo [INFO] Removed dev PID file
    )
    if exist ".local-prod.pid" (
        del ".local-prod.pid"
        echo [INFO] Removed prod PID file
    )
) else (
    if exist ".local-%MODE%.pid" (
        del ".local-%MODE%.pid"
        echo [INFO] Removed %MODE% PID file
    )
)

if "%MODE%"=="" (
    echo [OK] All local environments stopped
    echo [INFO] You can restart with: scripts\start-local.bat [dev^|prod]
) else (
    echo [OK] Local %MODE% environment stopped
    echo [INFO] You can restart with: scripts\start-local.bat %MODE%
)
echo.
echo Press any key to continue...
pause > nul