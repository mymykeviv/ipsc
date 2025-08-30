# PowerShell script to start local development environment
# Usage: .\scripts\start-local.ps1

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\scripts\start-local.ps1"
    Write-Host "Starts the ProfitPath application locally without Docker"
    Write-Host ""
    Write-Host "Requirements:"
    Write-Host "  - Python 3.10+ (python or python3 command available)"
    Write-Host "  - Node.js 18+ (npm command available)"
    Write-Host "  - PostgreSQL (optional, will fallback to SQLite)"
    exit 0
}

# Configuration
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$BACKEND_DIR = Join-Path $ROOT_DIR "backend"
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend"
$PIDFILE = Join-Path $ROOT_DIR ".local-dev.pid"

# Colors for output
function Write-Log { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERR] $Message" -ForegroundColor Red }

# Cleanup function
function Stop-LocalServices {
    Write-Log "Cleaning up processes..."
    if (Test-Path $PIDFILE) {
        Get-Content $PIDFILE | ForEach-Object {
            if ($_ -match '^\d+$') {
                try {
                    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
                    Write-Log "Stopped process $_"
                } catch {
                    # Process might already be stopped
                }
            }
        }
        Remove-Item $PIDFILE -Force
    }
    
    # Kill any remaining processes on our ports
    Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Register cleanup on exit
Register-EngineEvent PowerShell.Exiting -Action { Stop-LocalServices }

# Trap Ctrl+C (simplified for compatibility)
try {
    [Console]::TreatControlCAsInput = $false
} catch {
    # Ignore if not supported
}

Write-Log "Starting ProfitPath local development environment..."

# Check if already running
if (Test-Path $PIDFILE) {
    Write-Warning "Local development appears to be running already."
    Write-Warning "If this is incorrect, delete $PIDFILE and try again."
    Write-Warning "Or run: .\scripts\stop-local.ps1"
    exit 1
}

# Detect Python command
$PYTHON_CMD = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $version = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $version -match "Python (\d+)\.(\d+)") {
            $major = [int]$matches[1]
            $minor = [int]$matches[2]
            if ($major -eq 3 -and $minor -ge 10) {
                $PYTHON_CMD = $cmd
                Write-Log "Found Python: $version"
                break
            } elseif ($major -eq 3) {
                Write-Warning "Found Python $major.$minor, but 3.10+ is recommended"
                $PYTHON_CMD = $cmd
                break
            }
        }
    } catch {
        # Command not found, continue
    }
}

if (-not $PYTHON_CMD) {
    Write-Error "Python 3.10+ is required but not found."
    Write-Error "Please install Python 3.10+ and ensure it's in your PATH."
    exit 1
}

# Check Node.js
try {
    $nodeVersion = & node --version 2>&1
    if ($LASTEXITCODE -eq 0 -and $nodeVersion -match "v(\d+)\.(\d+)") {
        $major = [int]$matches[1]
        if ($major -lt 18) {
            Write-Warning "Node.js 18+ is recommended. Found: $nodeVersion"
        } else {
            Write-Log "Found Node.js: $nodeVersion"
        }
    } else {
        Write-Error "Node.js is required but not found or invalid version."
        Write-Error "Please install Node.js 18+ and ensure it's in your PATH."
        exit 1
    }
} catch {
    Write-Error "Node.js 18+ is required but not found."
    Write-Error "Please install Node.js 18+ and ensure it's in your PATH."
    exit 1
}

# Check npm
try {
    $npmVersion = & npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Found npm: $npmVersion"
    } else {
        Write-Error "npm is required but not found."
        exit 1
    }
} catch {
    Write-Error "npm is required but not found."
    exit 1
}

# Initialize PID file
New-Item -ItemType File -Path $PIDFILE -Force | Out-Null

# --- Backend Setup ---
Write-Log "Setting up backend..."
Push-Location $BACKEND_DIR
try {
    # Check for virtual environment
    $venvPath = $null
    if (Test-Path "venv\Scripts\activate.ps1") {
        $venvPath = "venv\Scripts\activate.ps1"
    } elseif (Test-Path ".venv\Scripts\activate.ps1") {
        $venvPath = ".venv\Scripts\activate.ps1"
    } elseif (-not $env:VIRTUAL_ENV) {
        Write-Log "Creating Python virtual environment..."
        & $PYTHON_CMD -m venv venv
        $venvPath = "venv\Scripts\activate.ps1"
    }
    
    if ($venvPath) {
        Write-Log "Activating virtual environment..."
        & $venvPath
    }
    
    # Install dependencies
    try {
        & python -c "import uvicorn" 2>$null
    } catch {
        Write-Log "Installing backend dependencies..."
        & python -m pip install --upgrade pip
        & python -m pip install -r requirements.txt
    }
    
    # Environment variables
    $env:ENVIRONMENT = "development"
    $env:LOG_LEVEL = "INFO"
    $env:DEBUG = "true"
    
    # Database setup
    try {
        & psql -h localhost -U postgres -d postgres -c "SELECT 1;" 2>$null | Out-Null
        $env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/profitpath"
        Write-Log "Using PostgreSQL database"
    } catch {
        $env:DATABASE_URL = "sqlite:///./profitpath.db"
        Write-Warning "PostgreSQL not available, using SQLite database"
    }
    
    # Run database migrations
    try {
        & alembic upgrade head 2>$null
        Write-Log "Database migrations completed"
    } catch {
        Write-Warning "Migration failed or alembic not found, continuing..."
    }
    
    Write-Log "Starting backend API on http://localhost:8000"
    $backendProcess = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru -WindowStyle Hidden
    Add-Content -Path $PIDFILE -Value $backendProcess.Id
    Write-Success "Backend started with PID $($backendProcess.Id)"
} finally {
    Pop-Location
}

# --- Frontend Setup ---
Write-Log "Setting up frontend..."
Push-Location $FRONTEND_DIR
try {
    # Install dependencies
    if (-not (Test-Path "node_modules") -or -not (Test-Path "node_modules\.package-lock.json")) {
        Write-Log "Installing frontend dependencies..."
        try {
            & npm ci --no-audit --no-fund
        } catch {
            & npm install --no-audit --no-fund
        }
    }
    
    # Force Rollup to use JS implementation
    $env:ROLLUP_SKIP_NODEJS_NATIVE = "true"
    
    Write-Log "Starting frontend dev server on http://localhost:5173"
    $frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173" -PassThru -WindowStyle Hidden
    Add-Content -Path $PIDFILE -Value $frontendProcess.Id
    Write-Success "Frontend started with PID $($frontendProcess.Id)"
} finally {
    Pop-Location
}

# Wait for services to start
Start-Sleep -Seconds 3

# Display status
Write-Log "Local development environment started!"
Write-Success "Backend API: http://localhost:8000"
Write-Success "Frontend App: http://localhost:5173"
Write-Log "To stop the services, run: .\scripts\stop-local.ps1"
Write-Log "Press Ctrl+C to stop all services"

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
        # Check if processes are still running
        $pids = Get-Content $PIDFILE -ErrorAction SilentlyContinue
        $runningCount = 0
        foreach ($pid in $pids) {
            if ($pid -match '^\d+$' -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
                $runningCount++
            }
        }
        if ($runningCount -eq 0) {
            Write-Warning "All processes have stopped"
            break
        }
    }
} catch {
    Write-Log "Stopping services..."
} finally {
    Stop-LocalServices
}