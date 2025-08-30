@echo off
setlocal enabledelayedexpansion

echo [INFO] Stopping local development processes...

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
taskkill /FI "WINDOWTITLE eq Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Dev Server*" /F >nul 2>&1

REM Remove PID file
if exist ".local-dev.pid" (
    del ".local-dev.pid"
    echo [INFO] Removed PID file
)

echo [OK] Local development environment stopped
echo [INFO] You can restart with: scripts\start-local.bat
echo.
echo Press any key to continue...
pause > nul