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
    echo [INFO] This will upgrade/overwrite the existing installation
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

REM Create virtual environment (required for production)
echo [INFO] Creating Python virtual environment for production...

REM Skip venv testing - just try to create it directly
echo [INFO] Creating virtual environment...

REM Try creating virtual environment with different methods
echo [INFO] Attempting to create virtual environment...
REM Redirect stderr to avoid confusion from "Could not find platform independent libraries" warning
%PYTHON_CMD% -m venv venv --clear 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Standard venv creation failed, trying alternative method...
    rmdir /s /q venv 2>nul
    %PYTHON_CMD% -m venv venv 2>nul
    if %errorlevel% neq 0 (
        echo [WARNING] Alternative venv creation failed, trying Python API method...
        rmdir /s /q venv 2>nul
        %PYTHON_CMD% -c "import venv; venv.create('venv', with_pip=True)" 2>nul
        if %errorlevel% neq 0 (
            echo ERROR: All virtual environment creation methods failed
            echo.
            echo This may be due to:
            echo 1. Insufficient permissions (try running as administrator)
            echo 2. Corrupted Python installation
            echo 3. Disk space issues
            echo 4. Antivirus software blocking file creation
            echo 5. Python installed from Microsoft Store (use python.org version)
            echo.
            echo Please try:
            echo 1. Run as administrator
            echo 2. Reinstall Python from https://python.org/downloads/
            echo 3. Temporarily disable antivirus during installation
            echo.
            pause
            exit /b 1
        )
    )
)
echo [INFO] Virtual environment created successfully

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)
echo [INFO] Virtual environment activated

echo [INFO] Upgrading pip in virtual environment...
python -m pip install --upgrade pip

echo [INFO] Installing Python dependencies in virtual environment...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies in virtual environment
    echo.
    echo This may be due to:
    echo 1. Missing or corrupted offline package cache
    echo 2. Incompatible Python version (requires 3.8+)
    echo 3. Architecture mismatch (32-bit vs 64-bit)
    echo 4. Insufficient disk space
    echo.
    pause
    exit /b 1
)
cd ..\..
echo [OK] Python dependencies installed in virtual environment

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