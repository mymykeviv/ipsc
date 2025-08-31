@echo off
setlocal enabledelayedexpansion

REM Parse arguments for mode (dev or prod)
set MODE=dev
if "%1"=="prod" set MODE=prod
if "%1"=="dev" set MODE=dev
if "%1"=="--help" (
    echo Usage: start-local.bat [dev^|prod]
    echo   dev  - Development mode (default): debug enabled, hot reload, SQLite
    echo   prod - Production mode: optimized settings, SQLite database
    exit /b 0
)

echo [INFO] Starting ProfitPath local environment in %MODE% mode...

REM Check if already running
if exist ".local-%MODE%.pid" (
    echo [WARN] Local %MODE% environment appears to be running already.
    echo [WARN] If this is incorrect, delete .local-%MODE%.pid and try again.
    echo [WARN] Or run: scripts\stop-local.bat %MODE%
    pause
    exit /b 1
)

REM Create PID file
echo. > .local-%MODE%.pid

REM Start backend
echo [INFO] Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Check and install backend dependencies if needed
echo [INFO] Checking backend dependencies...
python -c "import fastapi, uvicorn" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing backend dependencies...
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo [INFO] Backend dependencies already installed
)

REM Set environment variables based on mode
if "%MODE%"=="dev" (
    set ENVIRONMENT=development
    set LOG_LEVEL=DEBUG
    set DEBUG=true
    set RELOAD=true
    set DATABASE_URL=sqlite:///./profitpath.db
    set DATABASE_TYPE=sqlite
    echo [INFO] Development mode: Using SQLite database with debug settings
) else (
    set ENVIRONMENT=production
    set LOG_LEVEL=INFO
    set DEBUG=false
    set RELOAD=false
    set DATABASE_URL=sqlite:///./profitpath.db
    set DATABASE_TYPE=sqlite
    echo [INFO] Production mode: Using SQLite database with optimized settings
)

REM Run database migrations if alembic is available
echo [INFO] Running database migrations...
python -c "import alembic" >nul 2>&1
if errorlevel 1 (
    echo [WARN] Alembic not found, skipping database migrations
    echo [WARN] You may need to set up the database manually
) else (
    alembic upgrade head >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Database migration failed, but continuing...
    ) else (
        echo [INFO] Database migrations completed successfully
    )
)

REM Start backend API
echo [INFO] Starting backend API on http://localhost:8000
if "%MODE%"=="dev" (
    start "Backend API (%MODE%)" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug"
) else (
    start "Backend API (%MODE%)" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info"
)

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Switch to frontend directory
cd ..
cd frontend

REM Check and install frontend dependencies based on mode
echo [INFO] Checking frontend dependencies...
if "%MODE%"=="dev" (
    if not exist "node_modules" (
        echo [INFO] Installing all frontend dependencies...
        cmd /c "npm install"
        if errorlevel 1 (
            echo [ERROR] Failed to install frontend dependencies
            pause
            exit /b 1
        )
    ) else (
        echo [INFO] Frontend dependencies already installed
    )
) else (
    if not exist "node_modules" (
        echo [INFO] Installing production frontend dependencies...
        cmd /c "npm install --production"
        if errorlevel 1 (
            echo [ERROR] Failed to install frontend dependencies
            pause
            exit /b 1
        )
    ) else (
        echo [INFO] Frontend dependencies already installed
    )
)

REM Set environment variables for frontend
set ROLLUP_SKIP_NODEJS_NATIVE=true
if "%MODE%"=="dev" (
    set NODE_ENV=development
    set VITE_API_URL=http://localhost:8000
) else (
    set NODE_ENV=production
    set VITE_API_URL=http://localhost:8000
)

REM Start frontend dev server
echo [INFO] Starting frontend dev server on http://localhost:5173
if "%MODE%"=="dev" (
    start "Frontend Dev Server (%MODE%)" cmd /k "cmd /c npx vite --host 0.0.0.0 --port 5173 --mode development"
) else (
    start "Frontend Dev Server (%MODE%)" cmd /k "cmd /c npx vite --host 0.0.0.0 --port 5173 --mode production"
)

REM Wait a moment for frontend to start
timeout /t 3 /nobreak > nul

REM Return to root directory
cd ..

echo.
echo [INFO] Local %MODE% environment started successfully
echo [OK] Backend API: http://localhost:8000
echo [OK] Frontend App: http://localhost:5173
if "%MODE%"=="dev" (
    echo [INFO] Development features: Hot reload enabled, SQLite database, debug logging
) else (
    echo [INFO] Production features: Optimized settings, SQLite database, info logging
)
echo [INFO] Both servers are running in separate windows
echo [INFO] To stop the services, run: scripts\stop-local.bat %MODE%
echo.
echo Press any key to exit this script (servers will keep running)...
pause > nul