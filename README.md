# ProfitPath - Invoicing, Purchases, Payment & Stock Control

A comprehensive business management system designed for Indian businesses with GST compliance, inventory management, and financial tracking capabilities.

https://github.com/user-attachments/assets/b677dcaf-356e-4bdd-babf-ddcaa20760f0

## 🚀 Current Version: 1.49.0

**Latest Features:**
- ✅ Consolidated Deployment System for dev, UAT, and production
- ✅ Invoice Template System with customization options
- ✅ Enhanced Parties Management with improved UX
- ✅ Automatic Cache Cleaning in all deployments
- ✅ Kubernetes Production Support
- ✅ Consolidated Documentation Structure (reduced from 46 to 15 files)
- ✅ **NEW: One-Click Deployment Packages** - No technical knowledge required!

## 📦 Download & Deploy

### 🎯 **For End Users - Easy Deployment**

**No setup required! Just download and run:**

1. **Download the latest release** from [GitHub Releases](https://github.com/your-username/ipsc/releases)
2. **Extract the package** to any directory
3. **Run the startup script:**
   ```bash
   # Windows: Double-click start.bat
   # Mac/Linux: Double-click start.sh or run ./start.sh
   ```
4. **Open your browser** and go to http://localhost
5. **Login** with admin / admin123

**That's it!** No dependencies, no commands, no configuration needed.

### 🪟 **Windows Users - Easy Setup**

**For Windows users, we provide special batch files for easy deployment:**

1. **Download the latest release** from [GitHub Releases](https://github.com/your-username/ipsc/releases)
2. **Extract the package** to any directory
3. **Double-click `start.bat`** to launch the application
4. **The application will automatically:**
   - Check if Docker is installed and running
   - Start all required services
   - Open the application in your browser
   - Display service status and health checks

**Additional Windows Commands:**
- **`stop.bat`** - Stop the application and all services
- **`test-deployment.bat`** - Test deployment and health checks

### 🚀 **For Developers - Local Development**

## 📋 Quick Start

### For End Users (Windows/Mac/Linux)

1. **Download** the latest release package for your platform
2. **Extract** the downloaded file to your desired location
3. **Run** the application:
   - **Windows**: Double-click `start-prod.bat`
   - **Mac/Linux**: Run `./start-prod.sh` in terminal
4. **Access** the application at `http://localhost:3000`
5. **Login** with default credentials:
   - Username: `admin`
   - Password: `admin123`

> 💡 **First-time setup**: The application will automatically create the database and install dependencies on first run.

### Port Configuration

The application uses a configurable port system to avoid conflicts:

- **Default Ports**: Backend (8000), Frontend (3000)
- **Configuration File**: `config/ports.json`
- **Automatic Port Checking**: The start script checks for port availability and provides clear error messages if ports are in use
- **Easy Customization**: Edit `config/ports.json` to change default ports

```json
{
  "backend_port": 8000,
  "frontend_port": 3000
}
```

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Local Development

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd profitpath
   ```

2. **Start Services**
   ```bash
   docker compose up -d
   ```

3. **Access Application**
   - Frontend (Dev/Local): http://localhost:5173 (Vite)
   - Backend API: http://localhost:8000
   - Database: localhost:5432
   - MailHog: http://localhost:8025

4. **Default Login**
   - Username: `admin`
   - Password: `admin123`

### Development Commands

```bash
# Backend tests
source .venv/bin/activate
python -m pytest tests/backend/ -v

# Frontend tests
cd frontend
npm test

# View logs
docker compose logs -f [service-name]
```

### Scripts (streamlined)

The project includes a streamlined set of scripts under `scripts/` for common dev and ops tasks.

- **`scripts/dev-up.sh`**
  - Start the Docker dev stack and run quick sanity tests.
  - Usage:
    ```bash
    ./scripts/dev-up.sh                 # start + tests
    SKIP_TESTS=1 ./scripts/dev-up.sh   # start only
    ./scripts/dev-up.sh --setup        # run preflight and pull images before start
    ```

- **`scripts/uat-up.sh`**
  - Start the UAT stack and optionally run regression/e2e tests.

- **`scripts/stop-stack.sh`**
  - Stop a Docker stack by environment. Runs backup automatically for `prod`.
  - Usage:
    ```bash
    ./scripts/stop-stack.sh dev|uat|prod
    ```

- **`scripts/seed.sh`**
  - Unified seeding for dev/test DBs. Requires active Python virtualenv.
  - Usage:
    ```bash
    ./scripts/seed.sh dev
    ./scripts/seed.sh test
    ```

- **`scripts/create-release.sh`**
  - Creates a versioned release by updating `VERSION`, committing, tagging, and pushing.
  - Supports build-type selection. See `docs/DEPLOYMENT_BUILDS.md`.
  - Usage:
    ```bash
    ./scripts/create-release.sh --build-type production 1.50.7
    ./scripts/create-release.sh --build-type prod-lite 1.50.7
    ```

- **`scripts/release-packager.sh`**
  - Builds backend/frontend Docker images and generates deployment packages.
  - Enforces compose file presence (fail-fast). Optional `--allow-embedded-compose` for explicit fallback.
  - Usage:
    ```bash
    ./scripts/release-packager.sh --build-type production 1.50.7 my-dockerhub
    ./scripts/release-packager.sh --build-type prod-lite 1.50.7 my-dockerhub
    ./scripts/release-packager.sh --build-type docker-prod 1.50.7 my-dockerhub
    ```

- **`scripts/clean.sh`**
  - Clean containers/images/volumes. Optionally target a specific stack; deep-clean artifacts.
  - Usage:
    ```bash
    ./scripts/clean.sh
    ./scripts/clean.sh --stack dev
    ./scripts/clean.sh --stack uat --deep
    ```

- **`scripts/test-runner.sh`**
  - Unified test orchestration (backend, frontend, e2e, health, all).

- **`scripts/start-local.sh`**
  - Run backend (FastAPI) and frontend (Vite) locally without Docker.

### Release Process (with local preflight)

- **`scripts/create-release.sh`**
  - Creates a versioned release by updating `VERSION`, committing, tagging, and pushing.
  - Runs local preflight checks before tagging:
    - Frontend: `npm ci --no-optional`, `npm run typecheck`, `npm run lint`, `npm run build`
    - Backend: applies Alembic migrations on a fresh temporary Postgres via Docker
  - Flags:
    - `--skip-preflight`: skip the local checks (faster, not recommended)
  - Usage:
    ```bash
    ./scripts/create-release.sh 1.50.7
    ./scripts/create-release.sh --skip-preflight 1.50.7
    ```

- **`scripts/release-packager.sh`**
  - Builds backend/frontend Docker images and generates cross-platform deployment packages.
  - Preflight checks run by default (skip with `--quick`):
    - Frontend: typecheck, lint, build
    - Backend: migration sanity on fresh DB via Docker
  - Flags:
    - `--quick`: skip preflight; single/multi-arch behavior depends on buildx availability
    - `--platform linux/amd64,linux/arm64`: specify target platforms
  - Usage:
    ```bash
    ./scripts/release-packager.sh 1.50.7 my-dockerhub
    ./scripts/release-packager.sh --quick 1.50.7 my-dockerhub
    ./scripts/release-packager.sh --platform linux/amd64,linux/arm64 1.50.7 my-dockerhub
    ```

#### Deprecated scripts (replaced by the above)

The following are superseded and will be removed in a future release. Use the replacements noted:

- `scripts/dev-setup.sh` → use `./scripts/dev-up.sh --setup`
- `scripts/quick-docker-build.sh` → use `./scripts/build-and-push-docker.sh --quick`
- `scripts/stop-docker-dev.sh` / `scripts/stop-docker-prod.sh` → use `./scripts/stop-stack.sh dev|prod`
- `scripts/run-ui-ux-tests.sh` → use `./scripts/test-runner.sh`
- `scripts/local-dev.sh`, `scripts/local-dev-clean.sh`, `scripts/restart-local-dev.sh`, `scripts/stop-local-dev.sh` → use `./scripts/start-local.sh` and `./scripts/clean.sh`

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with async support
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with Passlib
- **PDF Generation**: ReportLab for invoices
- **Email**: SMTP with OAuth2 support

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Testing**: Vitest with Testing Library, Playwright for E2E
- **Styling**: CSS Variables with utility classes

## 📚 Documentation

**📁 [View Complete Documentation](./docs/)**

Our documentation is now organized in a dedicated `docs/` folder for better structure and navigation:

### Quick Navigation
- **[Getting Started](./docs/README.md)** - Project overview and setup
- **[Architecture](./docs/ARCHITECTURE.md)** - System design and patterns
- **[Development Guide](./docs/DEV_PLAN.md)** - Development workflow
- **[Testing Guide](./docs/TEST_RUNNING_GUIDE.md)** - How to run tests
- **[Deployment](./docs/DEPLOYMENT.md)** - Deployment instructions
- **[Production Deployment (Native)](./docs/PRODUCTION_DEPLOYMENT.md)** - Native production deployment without Docker
- **[Deployment Builds](./docs/DEPLOYMENT_BUILDS.md)** - Build types and compose mappings
- **[Changelog](./docs/CHANGELOG.md)** - Version history and changes

### Documentation Categories
- **🚀 Getting Started** - Setup and quick start guides
- **📋 Requirements & Planning** - Project requirements and roadmap
- **🔧 Development & Testing** - Development workflow and testing
- **📊 Current Status & Reports** - Live status and monitoring
- **🎯 Feature Documentation** - Specific feature implementations
- **📝 Change Management** - Version history and change tracking

## 🎯 Key Features

### ✅ Implemented (v1.48.5)
- **Dashboard**: ProfitPath summary with working quick action buttons
- **Product Management**: Complete CRUD with enhanced error handling
- **Authentication**: JWT-based with role-based access control
- **Stock Management**: Real-time stock tracking and adjustments
- **GST Compliance**: Indian GST calculation and reporting
- **Enhanced Filter System**: Advanced filtering across all screens
- **Invoice Management**: Generate and email invoices with payment tracking
- **Purchase Management**: Complete purchase system with GST compliance
- **Expense Management**: Comprehensive expense tracking with categorization
- **ProfitPath Management**: Income vs expense analysis with date range filtering
- **Payment Management**: Enhanced payment system with multiple methods
- **Party Management**: Customer and vendor management with GST toggle
- **Audit Trail**: Comprehensive logging of all user actions
- **Reports**: GST summary reports with portal-compatible export

### 🚧 In Progress
- **Advanced Invoice Features**: Multi-currency support, recurring invoices
- **Purchase Order Management**: Complete PO workflow
- **Advanced Payment Tracking**: Payment scheduling and reminders
- **Inventory Management**: Advanced stock management features
- **Financial Reports**: Comprehensive P&L, balance sheet, cash flow reports
- **Email Integration**: Automated invoice delivery and payment reminders
- **Mobile App**: React Native mobile application

## 🔧 Development

### Code Organization
```
profitpath/
├── backend/           # FastAPI backend
├── frontend/          # React frontend
├── docs/             # 📁 Organized documentation
├── tests/            # Test files
├── scripts/          # Deployment and utility scripts
└── docker-compose.yml
```

### Testing Strategy
- **Backend**: Pytest with comprehensive API testing
- **Frontend**: Vitest with component and integration testing
- **E2E**: Playwright for end-to-end testing
- **Quality**: Automated quality checks and manual testing

### Quality Assurance
- **Systematic Change Management**: Impact analysis and backward compatibility
- **Comprehensive Testing**: Unit, integration, and E2E test coverage
- **Documentation Standards**: Clear documentation with every change
- **Error Handling**: Robust error handling and user feedback

## 🚀 Deployment

### Offline Installer Packages

For production deployment without Docker, use our offline installer packages:

- **Windows**: `ProfitPath-vX.X.X-Windows-Offline-Installer.zip`
- **Linux/Mac**: `ProfitPath-vX.X.X-Linux-Offline-Installer.tar.gz`

**Installation Requirements:**
- **Windows**: Administrator privileges required for installation
- **Python**: 3.8 or higher (automatically checked during installation)
- **Node.js**: 16 or higher (for frontend build)

**Key Features:**
- ✅ Configurable port system with automatic conflict detection
- ✅ Automatic dependency installation
- ✅ Database initialization with legacy engine support
- ✅ Production-ready configuration
- ✅ Easy start/stop scripts

### Docker Compose (Local & Production)
```bash
# Development (hot reload)
docker compose -f deployment/docker/docker-compose.dev.yml up -d
docker compose -f deployment/docker/docker-compose.dev.yml logs -f

# Local prod-like (debug enabled)
docker compose -f deployment/docker/docker-compose.prod.local.yml up -d

# Local prod-lite (debug enabled, single-tenant)
docker compose -f deployment/docker/docker-compose.prod-lite.local.yml up -d

# Production (distributable)
docker compose -f deployment/docker/docker-compose.prod.yml up -d
docker compose -f deployment/docker/docker-compose.prod.yml ps
docker compose -f deployment/docker/docker-compose.prod.yml logs -f

# Prod-lite (distributable single-tenant)
docker compose -f deployment/docker/docker-compose.prod-lite.yml up -d
```

Notes:
- Production/prod-lite frontend images use `frontend/Dockerfile.optimized` and are served by Nginx on container port 80.
- Dev uses Vite on port 5173; backend on 8000. See: `deployment/docker/docker-compose.dev.yml`.
- To stop stacks safely, prefer: `./scripts/stop-stack.sh prod` (performs a backup for prod).

### Version Management
- Backend version: Check `/api/version` endpoint
- Frontend version: Check browser console on load
- Database migrations: Automatic on startup

## 🤝 Contributing

1. Follow TDD approach
2. Write tests before implementation
3. Ensure all tests pass before committing
4. Update version numbers for releases
5. Follow systematic change management practices
6. Update documentation with every change

## 📄 License

Private - All rights reserved

---

**📚 [View Complete Documentation](./docs/) | 📋 [View Changelog](./docs/CHANGELOG.md) | 🐛 [Report Issues](https://github.com/your-repo/issues)**
