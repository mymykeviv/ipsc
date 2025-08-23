# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Setting Up WARP with Project-Specific Rules

### 1. **Configure WARP to Use This Repository's Rules**

To ensure WARP follows this project's specific development patterns:

1. **Point WARP to this repository**: Make sure WARP knows this is the active codebase
2. **Reference existing rules**: WARP will automatically read:
   - This `WARP.md` file for development guidance
   - `.cursor/rules/quality-rules.mdc` for critical development rules
   - `.cursor/rules/key-learnings.mdc` for change management rules

### 2. **Critical WARP Behavior Rules**

**ALWAYS:**
- ✅ Use existing scripts instead of direct commands
- ✅ Confirm before creating new files or scripts
- ✅ Update existing documentation rather than creating new files
- ✅ Search existing codebase before adding functionality
- ✅ Follow the established API and database patterns

**NEVER:**
- ❌ Create new scripts without confirming existing alternatives
- ❌ Use direct Docker/database commands when scripts exist
- ❌ Add duplicate functionality without checking existing code
- ❌ Skip the mandatory testing workflow

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**ProfitPath** (formerly IPSC - Invoice & Purchase System for Cashflow) is a comprehensive business management system designed for Indian businesses with GST compliance, inventory management, and financial tracking capabilities. It's a full-stack web application that supports both single-tenant and multi-tenant architectures.

**Current Version:** 1.4.5 (as of August 2025)  
**Status:** Production-ready with complete multi-tenancy implementation

## Essential Development Commands

### Quick Start - Development Environment
```bash
# Use the dedicated local development script
./scripts/local-dev.sh

# Alternative: Start with existing Docker script
./scripts/start-local.sh

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000 (docs at /docs)
# Database: localhost:5432
# MailHog: http://localhost:8025

# Default login credentials
# Username: admin
# Password: admin123
```

### Advanced Development Setup
```bash
# Automated deployment with testing (use existing script)
./scripts/automated_deploy.sh deploy dev

# Clean deployment using deployment script
./scripts/local-dev-clean.sh

# Development with test data seeding (use existing script)
./scripts/seed-dev.sh

# Setup development environment from scratch
./scripts/dev-setup.sh
```

### Testing Commands
```bash
# Unified test runner (all tests)
./scripts/test-runner.sh

# Individual test categories
./scripts/test-runner.sh backend    # Backend tests (pytest)
./scripts/test-runner.sh frontend  # Frontend tests (Vitest)
./scripts/test-runner.sh e2e       # End-to-end tests (Playwright)
./scripts/test-runner.sh health    # Health checks

# Backend tests with coverage
cd backend
python -m pytest tests/backend/ --cov=app --cov-report=html

# Frontend tests with specific configurations
cd frontend
npm run test                        # Standard tests
npm run test:critical             # Memory-optimized tests
npm run test:e2e                   # E2E tests
npm run lint                       # Code linting
```

### Database Operations
```bash
# Development database setup with seed data
./scripts/seed-dev.sh

# Test database setup and cleanup
./scripts/setup_test_db.sh
./scripts/cleanup_test_db.sh

# Clean database setup (use existing script)
python ./scripts/bootstrap_db.py

# Database migration (when needed)
cd backend
alembic upgrade head
```

### Multi-Environment Deployment
```bash
# NEVER use manual deployment - ALWAYS use existing deployment scripts

# Development - Use existing deployment script
python deployment/deploy.py dev

# UAT (User Acceptance Testing) - Use deployment script with testing
python deployment/deploy.py uat --test

# Production (Kubernetes) - Use deployment script
python deployment/deploy.py prod --clean

# Alternative: Use automated deployment pipeline (recommended)
./scripts/automated_deploy.sh full-pipeline dev
```

### Service Management
```bash
# Stop all services using existing script
./scripts/stop-local.sh

# Restart development environment
./scripts/restart-local-dev.sh

# Clean stop and remove containers
./scripts/stop-local-dev.sh

# View logs (use docker compose for specific service logs)
docker compose logs -f [service-name]

# Service status
docker compose ps

# Individual service health checks
curl -f http://localhost:8000/health    # Backend
curl -f http://localhost:5173           # Frontend
```

## High-Level Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Ant Design
- **Backend**: FastAPI (Python) with async support + SQLAlchemy ORM
- **Database**: PostgreSQL (prod/dev), SQLite (testing)
- **Authentication**: JWT with role-based access control (RBAC)
- **Email**: SMTP with OAuth2 support (Gmail/Outlook)
- **Deployment**: Docker Compose (dev/UAT), Kubernetes (production)
- **Testing**: pytest (backend), Vitest + Playwright (frontend), unified test runner

### Unique Multi-Tenant Architecture

This system implements a sophisticated multi-tenant architecture that supports three deployment modes:

#### 1. **Row-Level Multi-Tenancy** (Primary Mode)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tenant A      │    │   Tenant B      │    │   Tenant C      │
│  (Dental)       │    │ (Manufacturing) │    │  (Business)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Shared App     │
                    │  Instance       │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Database       │
                    │  (Row-level     │
                    │   isolation)    │
                    └─────────────────┘
```

#### 2. **Domain-Specific Features**
The system provides specialized modules for different industries:
- **Dental Clinics**: Patient management, appointments, treatment history
- **Manufacturing**: BOM management, production orders, work centers
- **General Business**: Standard invoicing, inventory, GST compliance

#### 3. **Tenant Routing System**
Multiple tenant identification methods:
- **Subdomain routing**: `tenant1.app.com`, `tenant2.app.com`
- **Header-based**: `X-Tenant-ID` header
- **URL path**: `/tenant/tenant-id/...`
- **Query parameter**: `?tenant=tenant-id`

### Core Business Logic Services

#### GST Compliance Engine
- **GSTR-1 & GSTR-3B Reports**: Exact GST portal format compliance
- **Multi-level GST Control**: System-wide and party-level GST settings
- **HSN Code Management**: Product classification with tax rates
- **Place of Supply Logic**: Intra-state vs inter-state tax calculation

#### Advanced Features Implementation
- **Recurring Invoices**: Template-based recurring invoice generation
- **Payment Scheduler**: Advanced payment tracking with reminders
- **Multi-Currency Support**: Exchange rate management and conversion
- **Audit Trail**: Comprehensive logging of all user actions
- **Performance Optimization**: Query caching with 80% hit rate, 60% faster queries

### Security & Performance Framework

#### Multi-Layer Security
```typescript
// Example security implementation pattern
export const secureApiCall = async (endpoint: string, data: any) => {
  return await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'X-Tenant-ID': getTenantId(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}
```

- **Row-Level Security**: All data filtered by `tenant_id`
- **Data Encryption**: AES-256 encryption at rest and in transit
- **Rate Limiting**: Multi-level rate limiting (tenant, user, action-based)
- **RBAC**: Comprehensive role-based access control
- **Audit Logging**: Complete tracking of data access and modifications

## Development Guidelines from .cursor/rules/

### Critical Development Rules (NEVER VIOLATE)

#### 1. **Duplicate Prevention Protocol**
```bash
# ALWAYS run these searches before adding new functionality
grep -r "functionName" frontend/src/lib/api.ts
grep -r "endpointName" backend/app/routers.py
grep -r "className" backend/app/models.py
```

#### 2. **API Contract Validation**
```typescript
// ALWAYS use proper TypeScript interfaces
interface ApiResponse<T> {
  data: T[]
  total: number
  status: string
}

// NEVER use 'any' type
const fetchData = async (): Promise<ApiResponse<Product>> => {
  // Implementation with proper error handling
}
```

#### 3. **Error Handling Pattern (MANDATORY)**
```typescript
try {
  const result = await apiCall()
  // Handle success
} catch (err: any) {
  if (err.message.includes('422')) {
    // Handle validation errors
  } else if (err.message.includes('404')) {
    // Handle not found
  } else if (err.message.includes('401')) {
    // Handle authentication errors
  }
  handleApiError(err) // Use centralized error handler
}
```

### Change Management Rules

#### Impact Analysis (MANDATORY Before Changes)
1. **Search existing codebase** for related functionality
2. **Verify API contracts** between frontend/backend
3. **Check TypeScript types** are properly defined
4. **Validate API endpoints** exist and work
5. **Review existing patterns** in the codebase
6. **Plan migration path** for breaking changes

#### Testing Requirements
```bash
# ALWAYS run complete test suite before committing
./scripts/test-runner.sh

# For database changes, verify migrations work
cd backend
alembic upgrade head
alembic downgrade -1  # Test rollback
alembic upgrade head  # Re-apply
```

## Project-Specific Context & Current State

### GitHub Issues Status (25 Open Issues)
Based on the repository analysis, there are **25 open issues** in the "Phase-1" milestone, focusing on:

#### **CRITICAL Stories (Issues #73-76)** - Multi-Tenancy Foundation
- **#73**: Multi-Tenant Database Architecture ✅ (Implemented)
- **#74**: Tenant Routing Middleware ✅ (Implemented) 
- **#75**: Database Performance Optimization ✅ (Implemented)
- **#76**: Comprehensive Security Measures ✅ (Implemented)

#### **HIGH Priority Stories (Issues #77-81)** - Business Features
- **#77**: Client Branding System ✅ (Implemented)
- **#78**: Dental Clinic Patient Management ✅ (Implemented)
- **#79**: Manufacturing BOM Management ✅ (Implemented)
- **#80**: Domain-Specific User Interface ✅ (Implemented)
- **#81**: Automated Client Deployment ✅ (Implemented)

#### **MEDIUM Priority Stories (Issues #70-72)** - UI Enhancements
- **#70**: Saved Date Filter Presets ✅ (Implemented)
- **#71**: Date Filter Dashboard Integration ✅ (Implemented)
- **#72**: Date Filter Performance and Accessibility ✅ (Implemented)

### Recent Development Focus (Version 1.4.5)

#### **Current Issues Fixed**
- ✅ Frontend build issues resolved (TypeScript compilation, dependencies)
- ✅ Multi-tenancy configuration stabilized (disabled in dev, enabled in prod)
- ✅ Database schema consistency achieved
- ✅ API response validation fixed
- ✅ Comprehensive error handling implemented

#### **Known Technical Debt**
- Frontend test infrastructure needs memory optimization fixes
- Multi-tenancy should be re-enabled for production deployment
- Performance optimizations and code splitting pending

### Business Domain Knowledge

#### **Indian GST Compliance**
- **Tax Structure**: CGST, SGST, IGST, UTGST, CESS calculations
- **HSN Codes**: Harmonized System of Nomenclature for product classification
- **Place of Supply**: Determines intra-state vs inter-state GST
- **GSTIN Validation**: Format validation for GST registration numbers
- **E-way Bills**: Electronic waybills for goods transportation above ₹50,000

#### **Multi-Tenant Business Logic**
- **Tenant Isolation**: Complete data separation at row level
- **Domain-Specific Features**: Different UI/UX for dental, manufacturing, general business
- **Client Branding**: Custom themes, logos, and PDF generation per tenant
- **Performance**: 60% query improvement with tenant-specific optimizations

### Key Implementation Patterns

#### **API Function Template (MANDATORY)**
```typescript
export async function apiFunction<T>(params: ParamType): Promise<T> {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'X-Tenant-ID': getCurrentTenantId() // Multi-tenant support
    },
    body: JSON.stringify(params)
  })
  
  if (!response.ok) {
    try {
      const errorData = await response.json()
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }
  
  return response.json()
}
```

#### **Multi-Tenant Database Query Pattern**
```python
# ALWAYS include tenant filtering in queries
def get_products(db: Session, tenant_id: int, filters: dict = None):
    query = db.query(Product).filter(Product.tenant_id == tenant_id)
    
    # Apply additional filters
    if filters:
        if filters.get('category'):
            query = query.filter(Product.category == filters['category'])
    
    return query.all()
```

## Development Workflows

### Adding New Features
1. **Check GitHub issues** for related stories and requirements
2. **Search existing code** to prevent duplication 
3. **Plan tenant-aware implementation** (if multi-tenant feature)
4. **Implement backend** with proper validation and tenant filtering
5. **Add TypeScript interfaces** for API responses
6. **Implement frontend** following existing UI patterns
7. **Write comprehensive tests** for all scenarios
8. **Update documentation** and changelog

### GST-Related Development
- All GST features must respect **party-level GST settings**
- GSTR reports must follow **exact GST portal format**
- Validate **GSTIN format** before processing
- Consider **place of supply** for tax calculations
- Test with **multiple scenarios** (intra-state, inter-state, export)

### Multi-Tenant Development
- **Always include `tenant_id`** in database queries
- **Test tenant isolation** thoroughly
- **Consider performance impact** of tenant switching
- **Implement tenant-aware caching**
- **Validate tenant permissions** at API level

## Deployment & Production Considerations

### Environment Configurations
- **Development**: Multi-tenancy disabled, debug enabled, hot reloading
- **UAT**: Multi-tenancy enabled, production-like settings, testing optimized
- **Production**: Kubernetes deployment, high availability, monitoring enabled

### Performance Metrics (Achieved)
- **Database Performance**: 60% improvement in query response times
- **Frontend Performance**: Bundle reduced from 412KB to 350KB  
- **Multi-Tenancy**: < 10ms tenant identification
- **Test Coverage**: >30% backend coverage, comprehensive E2E coverage

This codebase represents a mature, production-ready business management system with sophisticated multi-tenant architecture. Follow the established patterns, respect the development rules, and always consider the multi-tenant context when implementing new features.

### Key File Locations
- **Main Application**: `backend/app/main.py`, `frontend/src/modules/App.tsx`
- **Multi-Tenant Logic**: `backend/app/middleware/tenant_routing.py`, `backend/app/tenant_service.py`
- **GST Compliance**: `backend/app/gst.py`, `backend/app/gst_reports.py`
- **Domain Services**: `backend/app/dental_service.py`, `backend/app/manufacturing_service.py`
- **Testing**: `scripts/test-runner.sh`, `frontend/tests/e2e/`
- **Deployment**: `deployment/deploy.py`, `scripts/automated_deploy.sh`
