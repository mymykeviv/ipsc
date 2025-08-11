# IPSC Development Plan

## 1. Project Initialization

- [ ] Set up Git repository and basic directory structure
- [ ] Initialize backend (FastAPI) and frontend (React) projects
- [ ] Create `docker-compose.yml` for local orchestration
- [ ] Set up PostgreSQL (SQLite for dev) and basic DB migrations
- [ ] Add README with setup instructions

## 2. Core Infrastructure

- [ ] Implement CI pipeline (GitHub Actions) for linting and tests
- [ ] Set up testing frameworks: Pytest (backend), Jest/Cypress (frontend)
- [ ] Implement environment variable management for secrets/config

## 3. Authentication & RBAC

- [ ] Design user model and roles (Office Manager, Sales Rep, Accountant)
- [ ] Implement registration, login, JWT/session management
- [ ] Enforce RBAC in backend and frontend routes
- [ ] Write TDD test cases for all auth flows

## 4. Core Modules (Iterative, TDD for each)

### 4.1. Product Catalog & Stock Management
- [ ] CRUD for products
- [ ] Stock transactions (in/out/adjust)
- [ ] Automated/manual stock adjustments
- [ ] Tests for all endpoints and UI

### 4.2. Customer & Vendor Profiles
- [ ] CRUD for customer/vendor with GSTIN, type, contact
- [ ] GST status handling
- [ ] Tests

### 4.3. Sales & Purchase Management
- [ ] Record sales/purchases with payment heads
- [ ] Transaction history and trends
- [ ] Tests

### 4.4. Invoicing
- [ ] GST-compliant invoice generation (PDF/HTML)
- [ ] Automated GST calculation
- [ ] Email/send/export invoice
- [ ] Tests

### 4.5. GST Reporting
- [ ] Generate monthly/quarterly GST reports
- [ ] Export reports (CSV/PDF)
- [ ] Tests

### 4.6. Email Integration
- [ ] Local SMTP and OAuth2 (Gmail/Outlook) support
- [ ] Configurable email settings
- [ ] Tests

### 4.7. Analytics & Insights
- [ ] Basic sales/purchase analytics (from DB)
- [ ] (Optional) Integrate Elasticsearch for advanced analytics
- [ ] Tests

## 5. Security & Compliance

- [ ] Enforce HTTPS (dev/prod)
- [ ] Encrypt sensitive data at rest (DB-level)
- [ ] Password hashing (bcrypt/argon2)
- [ ] Tests for security features

## 6. Usability & UI Polish

- [ ] Responsive, intuitive UI for all roles
- [ ] Role-based dashboards and navigation
- [ ] User feedback/confirmation for all actions

## 7. Documentation & Handover

- [ ] Update README and architecture docs
- [ ] Add user/admin guides
- [ ] Backup/restore scripts

---

## Next Steps

**Permission required:**  
- Proceed to initialize the repository, create the directory structure, and scaffold the backend/frontend projects? Yes
- Any preferences for naming conventions or initial admin credentials? setup sample creds while dev is going on
