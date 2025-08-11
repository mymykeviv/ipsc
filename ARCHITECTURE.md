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
- Responsive, intuitive UI

### 2.2. Backend (FastAPI)
- RESTful API endpoints for all modules
- Business logic for GST, stock, invoicing, RBAC
- Email service (SMTP + OAuth2)
- Data encryption (at rest and in transit)
- Automated test suite (Pytest)

### 2.3. Database
- **PostgreSQL:** All transactional data (inventory, invoices, users, etc.)
- **Elasticsearch (optional):** Reporting, analytics, audit logs

---

## 3. Data Flow

1. **User logs in** → Auth API (JWT/session) → RBAC enforced
2. **User action (e.g., add stock)** → Frontend form → Backend API → DB transaction
3. **Invoice generation** → GST logic applied → PDF/HTML generated → Optionally emailed
4. **Reports/analytics** → Aggregated from DB (and Elasticsearch if enabled)

---

## 4. Security & Compliance

- HTTPS enforced (self-signed/local certs for dev)
- All sensitive data encrypted at rest (DB-level, e.g., pgcrypto)
- Passwords hashed (bcrypt/argon2)
- RBAC for all endpoints and UI routes
- GST compliance: All invoices/reports follow Indian GST law and formats

---

## 5. Developer Workflow

- **Local Dev:** `docker-compose up` (runs DB, backend, frontend)
- **Testing:** `pytest` (backend), `jest`/`cypress` (frontend)
- **Build:** Docker images for all services
- **Backup/Restore:** DB dump scripts, data export/import tools

---

## 6. Extensibility

- Modular backend (FastAPI routers per domain)
- Pluggable email backends (SMTP, OAuth2)
- Optional analytics/reporting engine (Elasticsearch)
- Easy migration to cloud if needed (no vendor lock-in)

---

## 7. Key Files & Directories

- `/frontend/` — React app
- `/backend/` — FastAPI app
- `/db/` — DB migrations, seed data
- `/tests/` — Automated tests
- `/docker-compose.yml` — Local orchestration
- `/ARCHITECTURE.md` — This document

---

## 8. Example Data Model (Simplified)

- **User:** id, username, password_hash, role
- **Product:** id, name, description, stock_qty, gst_rate
- **Customer/Vendor:** id, name, gstin, type, contact
- **Invoice:** id, customer_id, items, gst_breakup, total, pdf_url
- **StockTxn:** id, product_id, qty, type (in/out/adjust), date, ref

---

## 9. TDD & CI

- All features developed test-first (Pytest, Jest)
- CI pipeline (GitHub Actions) for lint, test, build

---

## 10. Deployment

- Local: `docker-compose up`
- Production: Docker/Kubernetes, environment variables for config

---

## 11. Future Enhancements

- Integrate Elasticsearch for advanced analytics
- Add mobile-friendly PWA support
- Expand RBAC for finer-grained permissions

---

**For further details, see `/Requirenments MVP.md` and module-specific docs.**
