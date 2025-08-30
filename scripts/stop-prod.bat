@echo off
REM ProfitPath Production Stop Script for Windows (No Docker)
REM Stops frontend and backend services running natively
REM Usage: scripts\stop-prod.bat

setlocal enabledelayedexpansion

echo ========================================
echo    ProfitPath Production Stop
echo    (Native - No Docker Required)
echo ========================================
echo.

echo [INFO] Stopping ProfitPath production services...
echo.

REM Stop backend service (FastAPI/Uvicorn on port 8000)
echo [INFO] Stopping backend service...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [INFO] Found backend process with PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Backend service stopped (PID: %%a)
    ) else (
        echo [WARNING] Failed to stop backend process (PID: %%a)
    )
)

REM Stop frontend service (Vite preview on port 4173)
echo [INFO] Stopping frontend service...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4173" ^| findstr "LISTENING"') do (
    echo [INFO] Found frontend process with PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Frontend service stopped (PID: %%a)
    ) else (
        echo [WARNING] Failed to stop frontend process (PID: %%a)
    )
)

REM Stop any remaining Python processes that might be related
echo [INFO] Stopping any remaining Python processes...
tasklist | findstr "python.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found Python processes, checking for ProfitPath related ones...
    REM Kill Python processes that are using our backend directory
    for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq python.exe" /FO CSV ^| findstr "python.exe"') do (
        set PID=%%a
        set PID=!PID:"=!
        REM This is a basic check - in production you might want more sophisticated process identification
        echo [INFO] Checking Python process PID: !PID!
    )
)

REM Stop any remaining Node.js processes that might be related
echo [INFO] Stopping any remaining Node.js processes...
tasklist | findstr "node.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found Node.js processes, checking for ProfitPath related ones...
    REM Kill Node processes that might be running Vite preview
    for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV ^| findstr "node.exe"') do (
        set PID=%%a
        set PID=!PID:"=!
        echo [INFO] Checking Node.js process PID: !PID!
    )
)

REM Close any ProfitPath related command windows
echo [INFO] Closing ProfitPath service windows...
taskkill /FI "WINDOWTITLE eq ProfitPath Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ProfitPath Frontend*" /F >nul 2>&1

echo.
echo [INFO] Verifying services are stopped...

REM Check if ports are now free
netstat -an | findstr ":8000" >nul 2>&1
if %errorlevel% neq 0 (
    echo [OK] Port 8000 (Backend) is now free
) else (
    echo [WARNING] Port 8000 (Backend) is still in use
)

netstat -an | findstr ":4173" >nul 2>&1
if %errorlevel% neq 0 (
    echo [OK] Port 4173 (Frontend) is now free
) else (
    echo [WARNING] Port 4173 (Frontend) is still in use
)

echo.
echo ========================================
echo    Production Services Stopped!
echo ========================================
echo.
echo All ProfitPath production services have been stopped.
echo.
echo To start services again: scripts\start-prod.bat
echo To rebuild: scripts\build-prod.bat
echo.
pause