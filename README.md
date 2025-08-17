# IPSC - Indian Payment & Stock Control

A comprehensive business management system designed for Indian businesses with GST compliance, inventory management, and financial tracking capabilities.

## Current Version: 1.42.0

**Latest Features:**
- ✅ Comprehensive Filter System across all major screens
- ✅ Advanced Date Range Filtering with preset options
- ✅ Real-time Filter Updates and Data Refresh
- ✅ Enhanced Products, Invoices, and Cashflow filtering
- ✅ Reusable Filter Components for consistent UI

## Features

### ✅ Implemented (v1.39.0)
- **Dashboard**: Cashflow summary with quick action buttons for common tasks
- **Product Management**: Complete CRUD with HSN/GST details
- **Authentication**: JWT-based with role-based access control
- **Stock Management**: Real-time stock tracking and adjustments
- **GST Compliance**: Indian GST calculation and reporting
- **GST Toggle System**: Enable/disable GST for individual parties and system-wide settings
- **Enhanced GST Reports**: GSTR-1 and GSTR-3B reports in exact GST portal format
- **Invoice Management**: Generate and email invoices with payment tracking
- **Purchase Management**: Complete purchase system with GST compliance and payment tracking
- **Expense Management**: Comprehensive expense tracking with categorization
- **Cashflow Management**: Income vs expense analysis with date range filtering
- **Payment Management**: Enhanced payment system with account heads and multiple payment methods
- **Party Management**: Customer and vendor management with GST toggle functionality
- **Audit Trail**: Comprehensive logging of all user actions
- **Reports**: GST summary reports (JSON/CSV) with portal-compatible export

### 🚧 In Progress
- **Advanced Invoice Features**: Multi-currency support, recurring invoices
- **Purchase Order Management**: Complete PO workflow
- **Advanced Payment Tracking**: Payment scheduling and reminders
- **Inventory Management**: Advanced stock management features
- **Financial Reports**: Comprehensive P&L, balance sheet, cash flow reports
- **Email Integration**: Automated invoice delivery and payment reminders
- **Mobile App**: React Native mobile application

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Local Development

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd ipsc
   ```

2. **Start Services**
   ```bash
   docker compose up -d
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
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

## Architecture

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
- **Browser Support**: Chrome and Firefox (Desktop only - MVP)

### Database Schema
- **Users & Roles**: RBAC system
- **Products**: Complete product catalog with HSN/GST
- **Parties**: Customers and vendors
- **Transactions**: Invoices, purchases, payments
- **Stock**: Real-time stock ledger
- **Settings**: Company and system configuration

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `PATCH /api/products/{id}/toggle` - Toggle product status

### Stock
- `GET /api/stock/summary` - Stock summary
- `POST /api/stock/adjust` - Manual stock adjustment

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/{id}/pdf` - Download PDF

### Reports
- `GET /api/reports/gst-summary` - GST summary (JSON)
- `GET /api/reports/gst-summary.csv` - GST summary (CSV)

## Deployment

### Production Deployment
```bash
# Build and deploy
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Version Management
- Backend version: Check `/api/version` endpoint
- Frontend version: Check browser console on load
- Database migrations: Automatic on startup

## Testing

### Backend Tests
```bash
# Run all tests
python -m pytest tests/backend/ -v

# Run specific test
python -m pytest tests/backend/test_products.py -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Contributing

1. Follow TDD approach
2. Write tests before implementation
3. Ensure all tests pass before committing
4. Update version numbers for releases

## License

Private - All rights reserved
