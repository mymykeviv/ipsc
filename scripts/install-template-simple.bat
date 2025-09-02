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
    rmdir /s /q "%INSTALL_DIR%"
)

mkdir "%INSTALL_DIR%"
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

REM Copy application files
echo [INFO] Installing application files...
xcopy "frontend" "%INSTALL_DIR%\frontend\" /E /I /H /Y
xcopy "backend" "%INSTALL_DIR%\backend\" /E /I /H /Y
xcopy "scripts" "%INSTALL_DIR%\scripts\" /E /I /H /Y
copy "VERSION" "%INSTALL_DIR%\"
copy "*.json" "%INSTALL_DIR%\" 2>nul
if exist "config" (
    mkdir "%INSTALL_DIR%\config"
    xcopy "config" "%INSTALL_DIR%\config\" /E /I /H /Y
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
    pause
    exit /b 1
)

echo [INFO] Installing dependencies from offline packages...
call venv\Scripts\activate.bat
pip install --no-index --find-links "..\..\python-packages" -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies from offline packages
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
cscript //nologo "%TEMP%\shortcut.vbs"
del "%TEMP%\shortcut.vbs"
echo [OK] Desktop shortcut created
echo.

REM Create start menu entry
echo [INFO] Creating start menu entry...
set STARTMENU_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\ProfitPath
mkdir "%STARTMENU_PATH%"
set STARTMENU_SHORTCUT=%STARTMENU_PATH%\ProfitPath.lnk
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\startmenu.vbs"
echo Set Shortcut = WshShell.CreateShortcut("%STARTMENU_SHORTCUT%") >> "%TEMP%\startmenu.vbs"
echo Shortcut.TargetPath = "%INSTALL_DIR%\scripts\start-prod.bat" >> "%TEMP%\startmenu.vbs"
echo Shortcut.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\startmenu.vbs"
echo Shortcut.Description = "ProfitPath" >> "%TEMP%\startmenu.vbs"
echo Shortcut.Save >> "%TEMP%\startmenu.vbs"
cscript //nologo "%TEMP%\startmenu.vbs"
del "%TEMP%\startmenu.vbs"
echo [OK] Start menu entry created
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