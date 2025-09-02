@echo off
REM ProfitPath Offline Installer for Windows
REM This template will be copied to the installer package

setlocal enabledelayedexpansion

echo ========================================
echo    ProfitPath Installer
echo    Offline Installation for Windows
echo ========================================
echo.

REM Check if running as administrator
REM Try multiple methods for better compatibility
set ADMIN_CHECK=0

REM Method 1: Try net session
net session >nul 2>&1
if %errorlevel% equ 0 set ADMIN_CHECK=1

REM Method 2: Try fsutil (fallback)
if %ADMIN_CHECK% equ 0 (
    fsutil dirty query %systemdrive% >nul 2>&1
    if %errorlevel% equ 0 set ADMIN_CHECK=1
)

REM Method 3: Try whoami (fallback)
if %ADMIN_CHECK% equ 0 (
    whoami /groups | find "S-1-16-12288" >nul 2>&1
    if %errorlevel% equ 0 set ADMIN_CHECK=1
)

REM Check if any method succeeded
if %ADMIN_CHECK% equ 0 (
    echo ERROR: This installer must be run as Administrator
    echo.
    echo Troubleshooting:
    echo 1. Right-click on the installer and select "Run as administrator"
    echo 2. If using PowerShell, run: Start-Process cmd -Verb RunAs
    echo 3. If using Command Prompt, run as administrator
    echo 4. Check Windows UAC settings if issues persist
    echo.
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
    set /p OVERWRITE="Overwrite existing installation? [y/N]: "
    if /i "%OVERWRITE%" neq "y" (
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

REM Copy application files
echo [INFO] Installing application files...
xcopy "frontend" "%INSTALL_DIR%\frontend\" /E /I /H /Y
xcopy "backend" "%INSTALL_DIR%\backend\" /E /I /H /Y
xcopy "scripts" "%INSTALL_DIR%\scripts\" /E /I /H /Y
copy "VERSION" "%INSTALL_DIR%\"
copy "*.json" "%INSTALL_DIR%\" 2>nul
copy "*.md" "%INSTALL_DIR%\" 2>nul
if exist "config" (
    mkdir "%INSTALL_DIR%\config"
    xcopy "config" "%INSTALL_DIR%\config\" /E /I /H /Y
)
echo [OK] Application files installed
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
        echo This offline installer requires Python 3.8 or higher to be installed.
        echo Please install Python from https://python.org/downloads/ and try again.
        echo.
        echo Make sure to:
        echo - Check "Add Python to PATH" during installation
        echo - Restart your command prompt after installation
        echo.
        pause
        exit /b 1
    )
)
echo [OK] Python found using '%PYTHON_CMD%' command
echo.

REM Install Python dependencies
echo [INFO] Installing Python dependencies...
cd "%INSTALL_DIR%\backend"

REM Try virtual environment first, fallback to system Python if it fails
echo [INFO] Attempting to create Python virtual environment...
%PYTHON_CMD% -m venv venv --clear >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Virtual environment created successfully
    call venv\Scripts\activate.bat
    if %errorlevel% equ 0 (
        echo [INFO] Virtual environment activated
        pip install --no-index --find-links "%~dp0python-packages" -r requirements.txt
        if %errorlevel% equ 0 (
            cd ..\..
            echo [OK] Python dependencies installed in virtual environment
            goto :dependencies_done
        )
    )
)

REM Fallback: Install to system Python with --user flag
echo [WARNING] Virtual environment failed, using system Python installation
echo [INFO] Installing packages to user directory...
%PYTHON_CMD% -m pip install --user --no-index --find-links "%~dp0python-packages" -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    echo.
    echo This may be due to:
    echo 1. Incomplete Python installation
    echo 2. Missing or corrupted offline package cache
    echo 3. Incompatible Python version (requires 3.8+)
    echo 4. Architecture mismatch (32-bit vs 64-bit)
    echo.
    echo Please try:
    echo 1. Reinstalling Python from https://python.org/downloads/
    echo 2. Ensuring Python was installed for all users
    echo 3. Restarting your computer after installation
    pause
    exit /b 1
)
cd ..\..
echo [OK] Python dependencies installed to user directory
echo [WARNING] Dependencies installed system-wide, not in virtual environment

:dependencies_done
echo.

REM Frontend build artifacts
echo [INFO] Frontend build artifacts already packaged
echo [OK] Frontend ready
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
echo ProfitPath has been installed to:
echo %INSTALL_DIR%
echo.
echo To start ProfitPath:
echo 1. Use the desktop shortcut
echo 2. Use the start menu entry
echo 3. Run: %INSTALL_DIR%\scripts\start-prod.bat
echo.
echo Installation completed successfully!
pause