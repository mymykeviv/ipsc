# Local Development Setup

This guide explains how to run the ProfitPath application locally without Docker on Windows, Linux, and macOS.

## Prerequisites

Before running the application locally, you need to install the following dependencies:

### Required Software

1. **Python 3.10+**
   - **Windows**: Download from [python.org](https://www.python.org/downloads/) or install via Microsoft Store
   - **macOS**: Install via Homebrew: `brew install python@3.10` or download from python.org
   - **Linux**: Install via package manager:
     - Ubuntu/Debian: `sudo apt update && sudo apt install python3.10 python3.10-venv python3-pip`
     - CentOS/RHEL: `sudo yum install python310 python310-pip`
     - Arch: `sudo pacman -S python python-pip`

2. **Node.js 18+**
   - **Windows**: Download from [nodejs.org](https://nodejs.org/) or install via Chocolatey: `choco install nodejs`
   - **macOS**: Install via Homebrew: `brew install node@18`
   - **Linux**: Install via package manager or NodeSource:
     - Ubuntu/Debian: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
     - CentOS/RHEL: `curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs`

3. **PostgreSQL (Optional)**
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **macOS**: Install via Homebrew: `brew install postgresql@15`
   - **Linux**: Install via package manager:
     - Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`
     - CentOS/RHEL: `sudo yum install postgresql-server postgresql-contrib`
   
   *Note: If PostgreSQL is not available, the application will automatically fallback to SQLite.*

## Quick Start

### Windows

1. **Using PowerShell (Recommended)**:
   ```powershell
   # Start the application
   powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
   
   # Stop the application (in another terminal)
   powershell -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1
   ```

2. **Using Git Bash or WSL**:
   ```bash
   # Start the application
   bash scripts/start-local.sh
   
   # Stop the application (Ctrl+C or in another terminal)
   bash scripts/stop-local.sh
   ```

### Linux/macOS

```bash
# Make scripts executable (first time only)
chmod +x scripts/start-local.sh scripts/stop-local.sh

# Start the application
./scripts/start-local.sh

# Stop the application (Ctrl+C or in another terminal)
./scripts/stop-local.sh
```

## What the Scripts Do

### Start Script (`start-local.sh` / `start-local.ps1`)

1. **Environment Check**: Verifies Python 3.10+ and Node.js 18+ are installed
2. **Backend Setup**:
   - Creates/activates Python virtual environment
   - Installs backend dependencies from `requirements.txt`
   - Sets up database (PostgreSQL or SQLite fallback)
   - Runs database migrations with Alembic
   - Starts FastAPI server on `http://localhost:8000`
3. **Frontend Setup**:
   - Installs Node.js dependencies
   - Configures Rollup to avoid native binding issues
   - Starts Vite dev server on `http://localhost:5173`
4. **Process Management**: Tracks process IDs for clean shutdown

### Stop Script (`stop-local.sh` / `stop-local.ps1`)

1. **Graceful Shutdown**: Stops tracked processes cleanly
2. **Port Cleanup**: Frees up ports 8000 and 5173
3. **Process Cleanup**: Kills any remaining uvicorn/vite processes

## Application URLs

Once started, the application will be available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc

## Port Configuration

### Configurable Port System

For production deployments using offline installer packages, the application includes a configurable port system:

- **Configuration File**: `config/ports.json`
- **Default Ports**: Backend (8000), Frontend (3000)
- **Automatic Port Checking**: Production scripts check port availability
- **Conflict Resolution**: Clear error messages if ports are in use

```json
{
  "backend_port": 8000,
  "frontend_port": 3000
}
```

**Note**: Local development uses fixed ports (5173 for frontend, 8000 for backend) for consistency with Vite dev server.

## Database Configuration

### PostgreSQL (Recommended)

If PostgreSQL is installed and running:

1. Create a database:
   ```sql
   CREATE DATABASE profitpath;
   CREATE USER profitpath WITH PASSWORD 'profitpath';
   GRANT ALL PRIVILEGES ON DATABASE profitpath TO profitpath;
   ```

2. The application will automatically use:
   ```
   DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/profitpath
   ```

### SQLite (Fallback)

If PostgreSQL is not available, the application automatically uses SQLite:
```
DATAbase_URL=sqlite:///./profitpath.db
```

### Database Compatibility

The application includes enhanced database compatibility:
- **Legacy Engine Support**: Uses `legacy_engine` parameter for older database systems
- **Automatic Migration**: Database schema is automatically updated on startup
- **Cross-Platform**: Works with both PostgreSQL and SQLite across different operating systems

## Troubleshooting

### Common Issues

1. **"Python not found"**
   - Ensure Python 3.10+ is installed and in your PATH
   - On Windows, try `py --version` instead of `python --version`
   - Restart your terminal after installation

2. **"Node.js not found"**
   - Ensure Node.js 18+ is installed and in your PATH
   - Restart your terminal after installation

3. **"Permission denied" (Linux/macOS)**
   - Make scripts executable: `chmod +x scripts/*.sh`

4. **"Execution policy" error (Windows PowerShell)**
   - Use the bypass flag: `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`
   - Or temporarily change policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

5. **Port already in use**
   - Stop any existing instances: run the stop script
   - Check for other applications using ports 8000 or 5173
   - Kill processes manually if needed:
     - Windows: `netstat -ano | findstr :8000` then `taskkill /PID <pid> /F`
     - Linux/macOS: `lsof -ti:8000 | xargs kill -9`
   - **Note**: Production deployments use configurable ports via `config/ports.json`

6. **Rollup native binding errors**
   - The scripts automatically set `ROLLUP_SKIP_NODEJS_NATIVE=true`
   - If issues persist, try: `npm install --force` in the frontend directory

7. **Database connection errors**
   - Check if PostgreSQL is running: `pg_isready` (if installed)
   - The application will fallback to SQLite if PostgreSQL is unavailable
   - For custom database URLs, set the `DATABASE_URL` environment variable

### Manual Setup

If the scripts don't work, you can start the services manually:

#### Backend
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

pip install -r requirements.txt
export DATABASE_URL="sqlite:///./profitpath.db"  # or PostgreSQL URL
alembic upgrade head  # Run migrations
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend
```bash
cd frontend
npm install
export ROLLUP_SKIP_NODEJS_NATIVE=true
npm run dev -- --host 0.0.0.0 --port 5173
```

## Development Tips

1. **Hot Reload**: Both backend and frontend support hot reload during development
2. **API Testing**: Use the Swagger UI at http://localhost:8000/docs for API testing
3. **Database Inspection**: 
   - PostgreSQL: Use pgAdmin or command line tools
   - SQLite: Use DB Browser for SQLite or command line: `sqlite3 profitpath.db`
4. **Logs**: Check terminal output for application logs and errors
5. **Environment Variables**: Create a `.env` file in the backend directory for custom configuration
6. **Production Testing**: Use offline installer packages to test production-like deployments
7. **Port Configuration**: For production testing, modify `config/ports.json` to avoid conflicts
8. **Cross-Platform**: Test on different operating systems using the appropriate offline installers

## Next Steps

- Review the main README.md for application-specific documentation
- Check the API documentation at http://localhost:8000/docs
- Explore the frontend at http://localhost:5173
- Set up your development environment with your preferred IDE/editor