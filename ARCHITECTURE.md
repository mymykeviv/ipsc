# IPSC Application Architecture

## Overview

The IPSC application is a web-based, platform-agnostic system for digitizing and streamlining inventory, invoicing, GST compliance, and business analytics for small-scale Indian manufacturers. It is designed for local deployment, with strong data integrity, security, and extensibility.

---

## 1. High-Level Architecture

- **Frontend:** React (SPA), communicates via REST API
- **Backend:** Python FastAPI (robust, async, type-safe)
- **Database:**
  - **Transactional:** PostgreSQL (ACID, scalable; SQLite for local/dev)
  - **Reporting/Audit:** Optional Elasticsearch (for analytics, can be added later)
- **Authentication:** Local username/password with RBAC (JWT/session)
- **Email:** Local SMTP and OAuth2 integration for Gmail/Outlook
- **Deployment:** Docker Compose (dev/prod), Kubernetes-ready

---

## 2. Major Components

### 2.1. Frontend (React)
- Role-based dashboards (Office Manager, Sales Rep, Accountant)
- Modules: Stock, Invoicing, Sales/Purchase, Catalog, Profiles, Reports, Analytics
- **GST Management**: GST toggle controls, GST report generation interface
- Responsive, intuitive UI

### 2.2. Backend (FastAPI)
- RESTful API endpoints for all modules
- Business logic for GST, stock, invoicing, RBAC
- **GST Reports Module**: GSTR-1 and GSTR-3B report generation
- **GST Toggle System**: Party-level and system-wide GST controls
- Email service (SMTP + OAuth2)
- Data encryption (at rest and in transit)
- Automated test suite (Pytest)

### 2.3. Database
- **PostgreSQL:** All transactional data (inventory, invoices, users, etc.)
- **GST Configuration:** Company settings and party-level GST preferences
- **Cashflow Data:** Consolidated from source tables (payments, purchase_payments, expenses)
- **Elasticsearch (optional):** Reporting, analytics, audit logs

---

## 3. Data Flow

1. **User logs in** → Auth API (JWT/session) → RBAC enforced
2. **User action (e.g., add stock)** → Frontend form → Backend API → DB transaction
3. **Invoice generation** → GST logic applied (conditional based on party settings) → PDF/HTML generated → Optionally emailed
4. **GST Reports** → Data validation → Report generation → CSV export for GST portal
5. **Reports/analytics** → Aggregated from DB (and Elasticsearch if enabled)

---

## 4. Security & Compliance

- HTTPS enforced (self-signed/local certs for dev)
- All sensitive data encrypted at rest (DB-level, e.g., pgcrypto)
- Passwords hashed (bcrypt/argon2)
- RBAC for all endpoints and UI routes
- **GST Compliance**: All invoices/reports follow Indian GST law and formats
- **GSTIN Validation**: Format validation for GST registration numbers
- **Data Validation**: Comprehensive validation before GST report generation

---

## 5. Developer Workflow

- **Local Dev:** `docker-compose up` (runs DB, backend, frontend)
- **Testing:** `pytest` (backend), `jest`/`cypress` (frontend)
- **GST Testing:** Comprehensive test data seeding and GST report validation
- **Build:** Docker images for all services
- **Backup/Restore:** DB dump scripts, data export/import tools

---

## 6. Extensibility

- Modular backend (FastAPI routers per domain)
- **GST Reports Engine**: Pluggable GST report generation system
- Pluggable email backends (SMTP, OAuth2)
- Optional analytics/reporting engine (Elasticsearch)
- Easy migration to cloud if needed (no vendor lock-in)

---

## 7. Key Files & Directories

- `/frontend/` — React app
- `/backend/` — FastAPI app
- `/backend/app/gst_reports.py` — GST report generation module
- `/backend/app/gst.py` — GST calculation and validation utilities
- `/backend/app/cashflow_service.py` — Consolidated cashflow data service
- `/backend/app/payment_scheduler.py` — Advanced payment tracking and scheduling service
- `/backend/app/inventory_manager.py` — Advanced inventory management and analytics service
- `/scripts/seed_test_data.py` — Comprehensive test data seeding
- `/tests/backend/test_gst_reports.py` — GST reports test suite
- `/tests/backend/test_gst_toggle.py` — GST toggle functionality tests
- `/tests/backend/test_cashflow_integration.py` — Cashflow integration tests
- `/tests/backend/test_payment_scheduler.py` — Payment scheduler functionality tests
- `/db/` — DB migrations, seed data
- `/tests/` — Automated tests
- `/docker-compose.yml` — Local orchestration
- `/ARCHITECTURE.md` — This document

---

## 8. Example Data Model (Simplified)

- **User:** id, username, password_hash, role
- **Product:** id, name, description, stock_qty, gst_rate, hsn_code
- **Customer/Vendor:** id, name, gstin, type, contact, gst_enabled
- **CompanySettings:** id, name, gstin, gst_enabled_by_default, require_gstin_validation
- **Invoice:** id, customer_id, items, gst_breakup, total, pdf_url
- **StockTxn:** id, product_id, qty, type (in/out/adjust), date, ref

---

## 9. GST Compliance Architecture

### 9.1. GST Toggle System
- **Party Level**: Individual GST enable/disable for customers/vendors
- **System Level**: Company-wide GST defaults and validation settings
- **Conditional Calculations**: GST calculations respect party GST settings

### 9.2. GST Reports Engine
- **GSTR-1**: Outward supplies report in exact GST portal format
- **GSTR-3B**: Monthly summary report with comprehensive tax calculations
- **Data Validation**: Pre-report generation validation for compliance
- **CSV Export**: Direct download for GST portal upload

### 9.3. GST Data Flow
1. **Party Creation**: GST settings configured during party setup
2. **Invoice Generation**: GST calculations applied based on party settings
3. **Report Generation**: Data aggregated and formatted for GST portal
4. **Validation**: Data quality checks before report generation
5. **Export**: CSV files ready for GST portal upload

---

## 10. TDD & CI

- All features developed test-first (Pytest, Jest)
- CI pipeline (GitHub Actions) for lint, test, build

---

## 11. Deployment

- Local: `docker-compose up`
- Production: Docker/Kubernetes, environment variables for config

---

## 12. Future Enhancements

- Integrate Elasticsearch for advanced analytics
- Add mobile-friendly PWA support
- Expand RBAC for finer-grained permissions

---

**For further details, see `/Requirenments MVP.md` and module-specific docs.**
