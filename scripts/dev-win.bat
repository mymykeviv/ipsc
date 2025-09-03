@echo off
setlocal

REM dev-win.bat - Start local development for backend (FastAPI) and frontend (Vite)
REM Usage: Double-click or run from terminal. Requires Python and Node.js/npm installed.

REM Move to repository root (scripts folder is at repo_root\scripts)
cd /d "%~dp0\.."

REM Set backend and frontend dev ports
set "BACKEND_PORT=8000"
set "FRONTEND_DEV_PORT=5173"

REM Check prerequisites
where python >nul 2>&1
IF ERRORLEVEL 1 GOTO NO_PY

where npm >nul 2>&1
IF ERRORLEVEL 1 GOTO NO_NPM

REM Optional: check uvicorn availability
python -c "import importlib, sys; sys.exit(0 if importlib.util.find_spec('uvicorn') else 1)" 1>nul 2>nul
IF ERRORLEVEL 1 echo [WARN] 'uvicorn' package not found. Install with: pip install "uvicorn[standard]" fastapi

REM Start backend in a new window
start "IPSC Backend" cmd /k "cd /d backend && python -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"

REM Start frontend in a new window
start "IPSC Frontend" cmd /k "cd /d frontend && npm run dev -- --port %FRONTEND_DEV_PORT%"

REM Open browser to frontend
start "" http://localhost:%FRONTEND_DEV_PORT%

REM Display info
echo.
echo ===============================================
echo IPSC Dev Started
echo Frontend: http://localhost:%FRONTEND_DEV_PORT%
echo Backend API: http://localhost:%BACKEND_PORT% (proxied by frontend dev server to /api if configured)
echo Close the spawned windows to stop each service.
echo ===============================================

goto :EOF

:NO_PY
echo [ERROR] Python not found in PATH. Please install Python 3.x and retry.
goto :EOF

:NO_NPM
echo [ERROR] npm not found in PATH. Please install Node.js (which includes npm) and retry.
goto :EOF

:EOF
endlocal