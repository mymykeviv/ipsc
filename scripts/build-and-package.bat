@echo off
REM ProfitPath Build and Package Script
REM Combines build-prod.bat and create-offline-installer.bat for one-step deployment
REM Usage: scripts\build-and-package.bat [version]

setlocal enabledelayedexpansion

echo ========================================
echo    ProfitPath Build and Package
echo ========================================
echo.

REM Set version from parameter or default
set VERSION=%1
if "%VERSION%"=="" (
    set /p VERSION="Enter version (e.g., 1.0.0): "
)

if "%VERSION%"=="" (
    echo ERROR: Version is required
    echo Usage: scripts\build-and-package.bat [version]
    pause
    exit /b 1
)

echo Building and packaging ProfitPath v%VERSION%...
echo.

REM Step 1: Build the application
echo [STEP 1/2] Building application...
echo ========================================
call scripts\build-prod.bat
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo [OK] Build completed successfully
echo.

REM Step 2: Create offline installer
echo [STEP 2/2] Creating offline installer package...
echo ========================================
call scripts\create-offline-installer.bat %VERSION%
if %errorlevel% neq 0 (
    echo ERROR: Installer creation failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Build and Package Complete!
echo ========================================
echo.
echo Package created: ProfitPath-v%VERSION%-Windows-Offline-Installer.zip
echo.
echo NEXT STEPS:
echo 1. Test the installer on a clean Windows system
echo 2. Distribute the ZIP file to target systems
echo 3. Extract and run install.bat as administrator
echo.
echo Build and package process completed successfully!
pause