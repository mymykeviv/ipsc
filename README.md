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

### Production Deployment
```bash
# Build and deploy
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

Notes:
- UAT/Prod frontend images are built from `frontend/Dockerfile.optimized` and served by Nginx on port 80.
- Dev/Standalone use Vite on port 5173.

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
