@echo off
REM ProfitPath Simple Offline Installer for Windows
REM This is a simplified installer that uses pre-packaged dependencies

setlocal enabledelayedexpansion

echo ========================================
echo    ProfitPath Simple Installer
echo    Offline Installation for Windows
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This installer must be run as Administrator
    echo.
    echo Please right-click on the installer and select "Run as administrator"
    pause
    exit /b 1
)

echo [INFO] Administrator privileges confirmed
echo.

REM Set installation directory
set INSTALL_DIR=C:\ProfitPath
set /p INSTALL_DIR="Enter installation directory [C:\ProfitPath]: "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=C:\ProfitPath

echo [INFO] Installing to: %INSTALL_DIR%
echo.

REM Create installation directory
if exist "%INSTALL_DIR%" (
    echo [WARNING] Installation directory already exists
    set /p OVERWRITE="Continue with upgrade? [Y/n]: "
    if /i "%OVERWRITE%"=="n" (
        echo Installation cancelled
        pause
        exit /b 1
    )
    echo [INFO] Removing existing installation...
    rmdir /s /q "%INSTALL_DIR%" 2>nul
    if exist "%INSTALL_DIR%" (
        echo ERROR: Could not remove existing installation directory
        echo Please manually delete %INSTALL_DIR% and try again
        pause
        exit /b 1
    )
)

mkdir "%INSTALL_DIR%" 2>nul
if not exist "%INSTALL_DIR%" (
    echo ERROR: Could not create installation directory: %INSTALL_DIR%
    echo Please check permissions and try again
    pause
    exit /b 1
)
echo [OK] Installation directory created
echo.

REM Check Python installation
echo [INFO] Checking Python installation...
set PYTHON_CMD=
python --version >nul 2>&1
if !errorlevel! equ 0 (
    set PYTHON_CMD=python
) else (
    py --version >nul 2>&1
    if !errorlevel! equ 0 (
        set PYTHON_CMD=py
    ) else (
        echo ERROR: Python is not installed or not in PATH
        echo.
        echo Please install Python 3.8+ from https://python.org/downloads/
        echo Make sure to check "Add Python to PATH" during installation
        pause
        exit /b 1
    )
)
echo [OK] Python found: %PYTHON_CMD%
echo.

REM Copy application files with better error handling
echo [INFO] Installing application files...

REM Copy frontend
if exist "frontend" (
    echo [INFO] Copying frontend files...
    robocopy "frontend" "%INSTALL_DIR%\frontend" /E /R:3 /W:1 /NP >nul
    if !errorlevel! gtr 7 (
        echo ERROR: Failed to copy frontend files
        pause
        exit /b 1
    )
    echo [OK] Frontend files copied
) else (
    echo [WARNING] Frontend directory not found, skipping...
)

REM Copy backend
if exist "backend" (
    echo [INFO] Copying backend files...
    robocopy "backend" "%INSTALL_DIR%\backend" /E /R:3 /W:1 /NP >nul
    if !errorlevel! gtr 7 (
        echo ERROR: Failed to copy backend files
        pause
        exit /b 1
    )
    echo [OK] Backend files copied
) else (
    echo ERROR: Backend directory not found
    pause
    exit /b 1
)

REM Copy scripts
if exist "scripts" (
    echo [INFO] Copying script files...
    robocopy "scripts" "%INSTALL_DIR%\scripts" /E /R:3 /W:1 /NP >nul
    if !errorlevel! gtr 7 (
        echo ERROR: Failed to copy script files
        pause
        exit /b 1
    )
    echo [OK] Script files copied
) else (
    echo ERROR: Scripts directory not found
    pause
    exit /b 1
)

REM Copy version and config files
if exist "VERSION" copy "VERSION" "%INSTALL_DIR%\" >nul
for %%f in (*.json) do copy "%%f" "%INSTALL_DIR%\" >nul 2>&1

if exist "config" (
    echo [INFO] Copying configuration files...
    robocopy "config" "%INSTALL_DIR%\config" /E /R:3 /W:1 /NP >nul
    if !errorlevel! gtr 7 (
        echo [WARNING] Some configuration files may not have been copied
    ) else (
        echo [OK] Configuration files copied
    )
)

echo [OK] Application files installed
echo.

REM Install Python dependencies from offline packages
echo [INFO] Installing Python dependencies from offline packages...
cd "%INSTALL_DIR%\backend"

REM Create simple virtual environment
echo [INFO] Creating virtual environment...
%PYTHON_CMD% -m venv venv --clear
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    echo.
    echo This may be due to:
    echo 1. Insufficient permissions
    echo 2. Corrupted Python installation
    echo 3. Antivirus software blocking file creation
    echo.
    pause
    exit /b 1
)

echo [INFO] Installing dependencies from offline packages...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Check if python-packages directory exists
if not exist "..\..\python-packages" (
    echo ERROR: Offline packages directory not found
    echo Expected: ..\..\python-packages
    pause
    exit /b 1
)

pip install --no-index --find-links "..\..\python-packages" -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies from offline packages
    echo.
    echo This may be due to:
    echo 1. Missing or corrupted offline package cache
    echo 2. Incompatible Python version (requires 3.8+)
    echo 3. Architecture mismatch (32-bit vs 64-bit)
    echo.
    pause
    exit /b 1
)

cd "..\.."
echo [OK] Python dependencies installed from offline packages
echo.

REM Create desktop shortcut
echo [INFO] Creating desktop shortcut...
set SHORTCUT_PATH=%USERPROFILE%\Desktop\ProfitPath.lnk
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\shortcut.vbs"
echo Set Shortcut = WshShell.CreateShortcut("%SHORTCUT_PATH%") >> "%TEMP%\shortcut.vbs"
echo Shortcut.TargetPath = "%INSTALL_DIR%\scripts\start-prod.bat" >> "%TEMP%\shortcut.vbs"
echo Shortcut.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\shortcut.vbs"
echo Shortcut.Description = "ProfitPath" >> "%TEMP%\shortcut.vbs"
echo Shortcut.Save >> "%TEMP%\shortcut.vbs"
cscript //nologo "%TEMP%\shortcut.vbs" >nul 2>&1
del "%TEMP%\shortcut.vbs" 2>nul
if exist "%SHORTCUT_PATH%" (
    echo [OK] Desktop shortcut created
) else (
    echo [WARNING] Desktop shortcut creation failed
)
echo.

REM Create start menu entry
echo [INFO] Creating start menu entry...
set STARTMENU_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\ProfitPath
mkdir "%STARTMENU_PATH%" 2>nul
set STARTMENU_SHORTCUT=%STARTMENU_PATH%\ProfitPath.lnk
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\startmenu.vbs"
echo Set Shortcut = WshShell.CreateShortcut("%STARTMENU_SHORTCUT%") >> "%TEMP%\startmenu.vbs"
echo Shortcut.TargetPath = "%INSTALL_DIR%\scripts\start-prod.bat" >> "%TEMP%\startmenu.vbs"
echo Shortcut.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\startmenu.vbs"
echo Shortcut.Description = "ProfitPath" >> "%TEMP%\startmenu.vbs"
echo Shortcut.Save >> "%TEMP%\startmenu.vbs"
cscript //nologo "%TEMP%\startmenu.vbs" >nul 2>&1
del "%TEMP%\startmenu.vbs" 2>nul
if exist "%STARTMENU_SHORTCUT%" (
    echo [OK] Start menu entry created
) else (
    echo [WARNING] Start menu entry creation failed
)
echo.

echo ========================================
echo    Installation Complete!
echo ========================================
echo ProfitPath has been installed to: %INSTALL_DIR%
echo.
echo To start ProfitPath:
echo 1. Use the desktop shortcut
echo 2. Use the start menu entry  
echo 3. Run: %INSTALL_DIR%\scripts\start-prod.bat
echo.
echo Installation completed successfully!
pause