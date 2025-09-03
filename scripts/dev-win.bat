@echo off
setlocal EnableExtensions

REM dev-win.bat - Robust dev launcher with auto dependency setup (no complex parentheses)

cd /d "%~dp0\.."

set "BACKEND_DIR=backend"
set "FRONTEND_DIR=frontend"
set "ARTIFACTS_DIR=artifacts\windows"
set "DEV_VENV=%ARTIFACTS_DIR%\.dev_venv"
set "BACKEND_PORT=8000"
set "FRONTEND_DEV_PORT=5173"

if not exist "%ARTIFACTS_DIR%" mkdir "%ARTIFACTS_DIR%"

REM Prefer Python launcher when available
where py >nul 2>&1
IF ERRORLEVEL 1 GOTO CHECK_PYTHON_EXE
set "PY_CMD=py -3"
GOTO HAVE_PY

:CHECK_PYTHON_EXE
where python >nul 2>&1
IF ERRORLEVEL 1 GOTO NO_PY
set "PY_CMD=python"

:HAVE_PY
if exist "%DEV_VENV%\Scripts\python.exe" GOTO HAVE_VENV
echo [INFO] Creating Python virtual environment at %DEV_VENV% using (%PY_CMD%) ...
%PY_CMD% -m venv "%DEV_VENV%"
IF ERRORLEVEL 1 GOTO VENV_FAIL

:HAVE_VENV
set "VENV_PY=%DEV_VENV%\Scripts\python.exe"
set "VENV_PIP=%DEV_VENV%\Scripts\pip.exe"

REM Bootstrap pip in venv (in case ensurepip needed)
"%VENV_PY%" -m ensurepip --upgrade >nul 2>nul
"%VENV_PIP%" install --upgrade pip setuptools wheel >nul 2>nul

REM Check if uvicorn present, if not install backend requirements
"%VENV_PY%" -c "import importlib, sys; sys.exit(0 if importlib.util.find_spec('uvicorn') else 1)" 1>nul 2>nul
IF ERRORLEVEL 1 GOTO INSTALL_BACKEND_DEPS
echo [INFO] Backend dependencies already present in venv.
GOTO CHECK_FRONTEND

:INSTALL_BACKEND_DEPS
echo [INFO] Installing backend dependencies from %BACKEND_DIR%\requirements.txt ...
call "%VENV_PIP%" install -r "%BACKEND_DIR%\requirements.txt"
IF ERRORLEVEL 1 GOTO PIP_FAIL

:CHECK_FRONTEND
if exist "%FRONTEND_DIR%\node_modules" GOTO START_SERVERS
echo [INFO] Installing frontend dependencies (npm install) ...
pushd "%FRONTEND_DIR%"
call npm install
IF ERRORLEVEL 1 GOTO NPM_FAIL
popd
GOTO START_SERVERS

:START_SERVERS
REM Start backend in a new window using venv python
start "IPSC Backend" cmd /k "cd /d %BACKEND_DIR% && ..\%ARTIFACTS_DIR%\.dev_venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"

REM Start frontend in a new window
start "IPSC Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev -- --port %FRONTEND_DEV_PORT%"

REM Open browser to frontend
start "" http://localhost:%FRONTEND_DEV_PORT%

echo.
echo ===============================================
echo IPSC Dev Started
echo Frontend: http://localhost:%FRONTEND_DEV_PORT%
echo Backend API: http://localhost:%BACKEND_PORT%
echo Close the spawned windows to stop each service.
echo ===============================================
GOTO EOF

:NO_PY
echo [ERROR] Python not found in PATH. Please install Python 3.x (enable 'py' launcher) and retry.
GOTO EOF

:VENV_FAIL
echo [ERROR] Failed to create virtual environment. Your system Python may be an embeddable build.
echo Install full Python from https://www.python.org/downloads/windows/ (check 'Add python.exe to PATH' and 'Install launcher for all users'), then retry.
GOTO EOF

:PIP_FAIL
popd >nul 2>nul
echo [ERROR] pip install failed. Please check your internet connection or proxy settings.
GOTO EOF

:NPM_FAIL
popd >nul 2>nul
echo [ERROR] npm install failed. Ensure Node.js/npm are installed and internet is available.
GOTO EOF

:EOF
endlocal