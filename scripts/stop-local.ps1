# PowerShell script to stop local development environment
# Usage: .\scripts\stop-local.ps1

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\scripts\stop-local.ps1"
    Write-Host "Stops the ProfitPath local development environment"
    exit 0
}

# Configuration
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$PIDFILE = Join-Path $ROOT_DIR ".local-dev.pid"

# Colors for output
function Write-Log { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERR] $Message" -ForegroundColor Red }

if (-not (Test-Path $PIDFILE)) {
    Write-Warning "No PID file found. Local development may not be running."
    Write-Log "Attempting to stop any remaining processes..."
    
    # Kill processes on our ports
    try {
        Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Log "Stopping process on port 8000 (PID: $($_.OwningProcess))"
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Port not in use
    }
    
    try {
        Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Log "Stopping process on port 5173 (PID: $($_.OwningProcess))"
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Port not in use
    }
    
    # Kill uvicorn processes
    Get-Process | Where-Object { $_.ProcessName -like "*python*" -and $_.CommandLine -like "*uvicorn*" } | ForEach-Object {
        Write-Log "Stopping uvicorn process (PID: $($_.Id))"
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Kill npm/node processes that might be running dev servers
    Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*vite*" } | ForEach-Object {
        Write-Log "Stopping vite process (PID: $($_.Id))"
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-Success "Cleanup attempt completed"
    exit 0
}

Write-Log "Stopping local development processes..."

# Read PIDs and stop processes
$stoppedCount = 0
$pids = Get-Content $PIDFILE -ErrorAction SilentlyContinue

foreach ($pid in $pids) {
    if ($pid -match '^\d+$') {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Log "Stopping process $pid ($($process.ProcessName))..."
                Stop-Process -Id $pid -ErrorAction SilentlyContinue
                
                # Wait a moment for graceful shutdown
                Start-Sleep -Seconds 1
                
                # Force kill if still running
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Warning "Force killing process $pid..."
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
                
                $stoppedCount++
            }
        } catch {
            # Process might already be stopped
        }
    }
}

# Remove PID file
Remove-Item $PIDFILE -Force -ErrorAction SilentlyContinue

if ($stoppedCount -gt 0) {
    Write-Success "Stopped $stoppedCount processes"
} else {
    Write-Warning "No running processes found"
}

# Additional cleanup
Write-Log "Performing additional cleanup..."

# Kill any remaining processes on our ports
try {
    Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Log "Cleaning up remaining process on port 8000 (PID: $($_.OwningProcess))"
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
} catch {
    # Port not in use
}

try {
    Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Log "Cleaning up remaining process on port 5173 (PID: $($_.OwningProcess))"
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
} catch {
    # Port not in use
}

# Kill any remaining uvicorn processes
Get-Process | Where-Object { $_.ProcessName -like "*python*" } | ForEach-Object {
    try {
        $commandLine = $_.CommandLine
        if ($commandLine -like "*uvicorn*app.main:app*") {
            Write-Log "Cleaning up remaining uvicorn process (PID: $($_.Id))"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Can't access command line or process already stopped
    }
}

# Kill any remaining npm/vite processes
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | ForEach-Object {
    try {
        $commandLine = $_.CommandLine
        if ($commandLine -like "*vite*" -or $commandLine -like "*npm*run*dev*") {
            Write-Log "Cleaning up remaining dev server process (PID: $($_.Id))"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Can't access command line or process already stopped
    }
}

Write-Success "Local development environment stopped"
Write-Log "You can restart with: .\scripts\start-local.ps1"