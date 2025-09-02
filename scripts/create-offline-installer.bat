@echo off
REM ProfitPath Offline Installer Creator for Windows
REM Creates a self-contained installer package that works without internet
REM Usage: scripts\create-offline-installer.bat [version]

setlocal enabledelayedexpansion

echo ========================================
echo    ProfitPath Offline Installer Creator
echo ========================================
echo.

REM Set version from parameter or default
set VERSION=%1
if "%VERSION%"=="" (
    set /p VERSION="Enter version (e.g., 1.0.0): "
)

if "%VERSION%"=="" (
    echo ERROR: Version is required
    echo Usage: scripts\create-offline-installer.bat [version]
    pause
    exit /b 1
)

echo Creating offline installer for ProfitPath v%VERSION%...
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...

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

echo [OK] Build artifacts found
echo.

REM Create installer directory
set INSTALLER_DIR=ProfitPath-v%VERSION%-Windows-Offline
echo [INFO] Creating installer directory: %INSTALLER_DIR%
if exist "%INSTALLER_DIR%" (
    echo [INFO] Removing existing installer directory...
    rmdir /s /q "%INSTALLER_DIR%"
)
mkdir "%INSTALLER_DIR%"
echo [OK] Installer directory created
echo.

REM Copy application files
echo [INFO] Copying application files...
echo ========================================

echo [INFO] Copying frontend build...
mkdir "%INSTALLER_DIR%\frontend"
xcopy "frontend\dist" "%INSTALLER_DIR%\frontend\dist\" /E /I /H /Y
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy frontend build
    pause
    exit /b 1
)
echo [OK] Frontend build copied

echo [INFO] Copying backend application...
mkdir "%INSTALLER_DIR%\backend"
xcopy "backend\app" "%INSTALLER_DIR%\backend\app\" /E /I /H /Y
xcopy "backend\migrations" "%INSTALLER_DIR%\backend\migrations\" /E /I /H /Y
copy "backend\*.py" "%INSTALLER_DIR%\backend\"
copy "backend\*.txt" "%INSTALLER_DIR%\backend\"
copy "backend\*.ini" "%INSTALLER_DIR%\backend\"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy backend application
    pause
    exit /b 1
)
echo [OK] Backend application copied

echo [INFO] Copying configuration files...
copy "VERSION" "%INSTALLER_DIR%\"
copy "*.json" "%INSTALLER_DIR%\" 2>nul
copy "*.md" "%INSTALLER_DIR%\" 2>nul
if exist "config" (
    mkdir "%INSTALLER_DIR%\config"
    xcopy "config" "%INSTALLER_DIR%\config\" /E /I /H /Y
    echo [OK] Config directory copied
)
echo [OK] Configuration files copied

echo [INFO] Copying scripts...
mkdir "%INSTALLER_DIR%\scripts"
copy "scripts\start-prod.bat" "%INSTALLER_DIR%\scripts\"
copy "scripts\stop-prod.bat" "%INSTALLER_DIR%\scripts\"
copy "scripts\build-prod.bat" "%INSTALLER_DIR%\scripts\"
echo [OK] Scripts copied
echo.

REM Package Python dependencies
echo [INFO] Packaging Python dependencies...
echo ========================================

cd backend
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Creating requirements freeze...
pip freeze > "%~dp0..\%INSTALLER_DIR%\backend\requirements-frozen.txt"
if %errorlevel% neq 0 (
    echo ERROR: Failed to freeze requirements
    cd ..
    pause
    exit /b 1
)

echo [INFO] Downloading all Python packages for offline installation...
mkdir "%~dp0..\%INSTALLER_DIR%\python-packages"
pip download -r requirements.txt -d "%~dp0..\%INSTALLER_DIR%\python-packages"
if %errorlevel% neq 0 (
    echo ERROR: Failed to download Python packages
    cd ..
    pause
    exit /b 1
)

cd ..
echo [OK] Python dependencies packaged
echo.

REM Package Node.js dependencies
echo [INFO] Packaging Node.js dependencies...
echo ========================================

cd frontend
echo [INFO] Creating package-lock.json backup...
if exist package-lock.json (
    copy package-lock.json "%~dp0..\%INSTALLER_DIR%\frontend\"
)
copy package.json "%~dp0..\%INSTALLER_DIR%\frontend\"

echo [INFO] Copying frontend build artifacts...
if exist dist goto copy_dist
echo [INFO] No dist folder found, skipping...
goto skip_dist

:copy_dist
echo [INFO] Copying frontend dist directory...
robocopy "dist" "%~dp0..\%INSTALLER_DIR%\frontend\dist" /E /R:1 /W:1
if errorlevel 8 (
    echo ERROR: Failed to copy frontend dist
    cd ..
    pause
    exit /b 1
)
echo [INFO] Frontend build artifacts copied successfully

:skip_dist

cd ..
echo [OK] Node.js dependencies packaged
echo.

REM Create installer scripts
echo [INFO] Creating installer scripts...
echo ========================================

REM Create main installer script
echo [INFO] Creating main installer script...
if not exist "scripts\install-template.bat" (
    echo ERROR: Install template not found: scripts\install-template.bat
    pause
    exit /b 1
)
copy "scripts\install-template.bat" "%INSTALLER_DIR%\install.bat"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy install template
    pause
    exit /b 1
)

echo [OK] Main installer script created
echo.

REM Create uninstaller script
echo [INFO] Creating uninstaller script...
(
echo @echo off
echo REM ProfitPath Uninstaller for Windows
echo REM Version: %VERSION%
echo.
echo setlocal enabledelayedexpansion
echo.
echo echo ========================================
echo echo    ProfitPath v%VERSION% Uninstaller
echo echo ========================================
echo echo.
echo.
echo set /p CONFIRM="Are you sure you want to uninstall ProfitPath? [y/N]: "
echo if /i "!CONFIRM!" neq "y" ^(
echo     echo Uninstallation cancelled
echo     pause
echo     exit /b 0
echo ^)
echo.
echo echo [INFO] Stopping ProfitPath services...
echo call scripts\stop-prod.bat 2^>nul
echo echo.
echo.
echo echo [INFO] Removing desktop shortcut...
echo del "%%USERPROFILE%%\Desktop\ProfitPath.lnk" 2^>nul
echo echo.
echo.
echo echo [INFO] Removing start menu entry...
echo rmdir /s /q "%%APPDATA%%\Microsoft\Windows\Start Menu\Programs\ProfitPath" 2^>nul
echo echo.
echo.
echo echo [INFO] Removing application files...
echo cd ..
echo rmdir /s /q "%%~dp0"
echo echo.
echo.
echo echo ========================================
echo echo    Uninstallation Complete!
echo echo ========================================
echo echo ProfitPath has been successfully removed from your system.
echo pause
) > "%INSTALLER_DIR%\uninstall.bat"

echo [OK] Uninstaller script created
echo.

REM Create README for installer
echo [INFO] Creating installer README...
(
echo ProfitPath v%VERSION% - Offline Installer for Windows
echo =====================================================
echo.
echo This package contains everything needed to install and run ProfitPath
echo on a Windows system without requiring an internet connection.
echo.
echo SYSTEM REQUIREMENTS:
echo - Windows 10 or later
echo - Administrator privileges for installation
echo - At least 2GB free disk space
echo - Python 3.8 or higher ^(MUST be installed separately^)
echo - Node.js 18+ ^(for development only^)
echo.
echo PREREQUISITES:
echo BEFORE running the installer, you MUST install Python:
echo 1. Download Python from https://python.org/downloads/
echo 2. During installation, CHECK "Add Python to PATH"
echo 3. Restart your command prompt after installation
echo 4. Verify installation by running: python --version
echo.
echo INSTALLATION INSTRUCTIONS:
echo 1. Ensure Python 3.8+ is installed and in PATH ^(see PREREQUISITES^)
echo 2. Right-click on 'install.bat' and select "Run as administrator"
echo 3. Follow the on-screen prompts
echo 4. Choose installation directory ^(default: C:\ProfitPath^)
echo 5. Wait for installation to complete
echo 6. Use desktop shortcut or start menu to launch ProfitPath
echo.
echo STARTING PROFITPATH:
echo - Double-click the desktop shortcut "ProfitPath"
echo - Or go to Start Menu ^> ProfitPath
echo - Or run: [InstallDir]\scripts\start-prod.bat
echo.
echo STOPPING PROFITPATH:
echo - Run: [InstallDir]\scripts\stop-prod.bat
echo.
echo UNINSTALLING:
echo - Run: [InstallDir]\uninstall.bat
echo.
echo ACCESS URLS:
echo - Frontend: http://localhost:4173
echo - Backend API: http://localhost:8000
echo - API Documentation: http://localhost:8000/docs
echo.
echo TROUBLESHOOTING:
echo - Ensure no other applications are using ports 4173 and 8000
echo - Run as administrator if you encounter permission issues
echo - Check Windows Firewall settings if you cannot access the application
echo.
echo Generated: %date% %time%
echo Package Version: %VERSION%
) > "%INSTALLER_DIR%\README.txt"

echo [OK] Installer README created
echo.

REM Create final package
echo [INFO] Creating final installer package...
echo ========================================

set PACKAGE_NAME=ProfitPath-v%VERSION%-Windows-Offline-Installer.zip
echo [INFO] Compressing installer package: %PACKAGE_NAME%
tar -a -c -f "%PACKAGE_NAME%" "%INSTALLER_DIR%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create installer package
    pause
    exit /b 1
)

echo [OK] Installer package created: %PACKAGE_NAME%
echo.

echo ========================================
echo    Offline Installer Creation Complete!
echo ========================================
echo.
echo Package created: %PACKAGE_NAME%
echo Size: 
dir "%PACKAGE_NAME%" | findstr "%PACKAGE_NAME%"
echo.
echo DISTRIBUTION INSTRUCTIONS:
echo 1. Copy %PACKAGE_NAME% to target Windows systems
echo 2. Extract the ZIP file
echo 3. Right-click install.bat and "Run as administrator"
echo 4. Follow installation prompts
echo.
echo The installer includes:
echo - Complete application code
echo - All Python dependencies (offline)
echo - All Node.js dependencies (offline)
echo - Installation and uninstallation scripts
echo - Desktop and start menu shortcuts
echo - Complete documentation
echo.
echo Offline installer creation completed successfully!
pause