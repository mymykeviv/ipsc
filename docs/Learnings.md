# Learnings: Alembic Baseline Migration and CI/CD Integration

## Key Decisions
- Single baseline Alembic migration represents the current schema; all future changes build on top of it.
- Run `alembic upgrade head` automatically before backend startup across environments.
- Seeding is dev-only; never seed automatically in UAT/Prod.

## Where Migrations Run Now
- Compose files: `deployment/docker/docker-compose.dev.yml`, `deployment/docker/docker-compose.uat.yml`, `deployment/docker/docker-compose.prod.yml`, `deployment/standalone/docker-compose.yml`, and root `docker-compose.yml` all prepend migrations to backend start.
- CI: `.github/workflows/ci.yml` runs Alembic against the test DB before backend tests and before launching the e2e backend server.
- Artifact generation: `.github/workflows/release-artifacts.yml` and `scripts/build-and-push-docker.sh` embed the migration step in generated Compose.
- Local dev: `scripts/local-dev.sh` and `scripts/local-dev-clean.sh` run Alembic before `uvicorn`.

## Environment Variables
- Ensure `DATABASE_URL` is set appropriately per environment before running migrations.
- Compose files already set DB URLs; CI jobs export test DB URL explicitly.

## Pitfalls Avoided
- Stale migrations during deploy due to missing upgrade step.
- Accidental seeding of production data.
- Divergence between CI test schema and runtime schema.

## Verification Checklist
- Backend logs show "alembic upgrade head" before server startup.
- Health checks pass after deployment: backend `/health`, frontend root.
- CI pipeline: migrations step passes before running tests.
- `alembic current` matches `head` in target environments.

## Optional Improvements
- Add an entrypoint script in `backend` image to run migrations before `uvicorn` as a defense-in-depth (compose currently overrides CMD).
- Add a lightweight prestart script hook to encapsulate migrations + readiness checks.
- Add a canary migration check in health monitoring to alert if DB is behind `head`.

## Rollback Considerations
- If a release fails post-migration, either:
  - Roll forward with a fix migration, or
  - Maintain reversible migrations for safe downgrade (baseline squashes often limit downgrades; plan accordingly).

## Documentation Updates Made
- `deployment/README.md`: Documented auto-run migrations and dev-only seeding policy.
- `docs/CI_CD_IMPLEMENTATION.md`: Added Database Migration Strategy section and updated CI details.
- `docs/CHANGELOG.md`: Logged version entry with all changes (v1.4.6).

## Commands (Examples)
```bash
# Local dev
alembic -c backend/alembic.ini upgrade head
uvicorn app.main:app --reload

# CI test DB
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/profitpath_test \
  alembic -c backend/alembic.ini upgrade head
```

---

## Authorization Case Sensitivity and Dev Docker Verification

### Context
- API endpoints use authorization dependencies `require_role(...)` and `require_any_role(["Admin","Store"])` in `backend/app/auth.py`.
- In dev DB, roles were inserted in lowercase (e.g., `admin`), while code checks used title case (e.g., `Admin`).

### Issue Observed
- Valid JWTs obtained from `/api/auth/login` resulted in `403 Forbidden` on protected endpoints like `POST /api/products`.
- Root cause: case-sensitive string comparison of role names.

### Resolution
- Updated `backend/app/auth.py` to compare role names case-insensitively in both `require_role` and `require_any_role`.
- No schema or data migration required; pure logic fix.

### Verification Steps
- Logged in with dev seed user `admin/admin123` to obtain JWT.
- Called `POST /api/products` with the token: response changed from 403 to 201 Created.
- Validated via curl and UI after logout/login to refresh token storage.

### Operational Notes
- Dev stack confirmed healthy using `deployment/docker/docker-compose.dev.yml`.
- Backend exposes `http://localhost:8000`; Frontend via Vite at `http://localhost:5173`.

### Takeaways
- Normalize security-critical string comparisons (e.g., roles) to avoid environment-specific casing drift.
- Prefer defensive checks in authorization to reduce coupling with seed data conventions.
- Keep verification recipes in docs to quickly triage auth-related 401/403 issues.

---

## Stock Register and Movement History Enrichment

### Context
- Inventory stakeholders require a stock register view containing SKU, Category, Supplier, Unit Price, Value, Remarks, Entry Type, and Running Balance per transaction, plus opening/closing summaries for accurate audit and reporting.

### Changes Implemented
- Backend (`backend/app/main_routers.py`)
  - `StockTransactionOut`: Added optional fields `sku`, `category`, `supplier_name` (add-only; backward compatible).
  - When `ref_type == 'purchase'`, join `Purchase` → `Party` to populate `supplier_name` and `reference_number`.
  - Preserved corrected signed running balance and magnitude-based totals:
    - Running balance: add signed qty for `in`, `out`, `adjust`.
    - Totals: incoming = sum(qty > 0), outgoing = sum(abs(qty < 0)).
- Frontend
  - `frontend/src/components/StockMovementHistoryTable.tsx`: Added columns and CSV export for `SKU`, `Category`, `Supplier`, and `Balance`.
  - `frontend/src/components/StockHistoryForm.tsx`: Mapped API fields to table rows, preserving sign normalization for `quantity_change`.

### Design Decisions
- Keep API backward compatible by adding optional fields only.
- Derive sign from entry type and store signed quantities to simplify running balance.
- Enrich only when applicable (supplier for purchase transactions) to avoid unnecessary joins.

### Testing and Verification
- Backend: Verified running balance equals opening + signed net across mixed sequences; validated totals split; confirmed presence of `sku`, `category`, and `supplier_name` when applicable.
- Frontend: Verified new columns render and CSV export includes them; modal drilldown shows enriched details.

### Operational Notes
- Supplier lookup introduces an additional query on purchase-linked rows; acceptable for current scale. Consider prefetch/caching if datasets grow.

### Next Steps
- Consider accepting signed quantities or an explicit direction for `/stock/adjust` to remove frontend remapping.
- Optional: add product category and supplier filters to the movement table.

---

## Company Settings Persistence: Upsert Backend + Frontend Wiring

### Context
- Users reported that saving Company Details showed success but did not persist. Invoices/Purchases failed with "Company settings not found".

### Root Causes
- Backend `PUT /api/company/settings` only updated an existing row and returned 404 if none existed.
- Frontend `Settings.tsx` form did not call the backend at all and included fields not present in `CompanySettings`.

### Changes Implemented
- Backend
  - Implemented upsert in both `backend/app/routers.py` and `backend/app/main_routers.py` for `PUT /api/company/settings`.
  - On missing settings, create with sensible defaults for required fields: `state` (Maharashtra), `state_code` (27), `invoice_series` (INV), GST flags true; set `tenant_id` from user if available.
  - Apply updates for provided fields present on the model.
- Frontend
  - `frontend/src/pages/Settings.tsx` now loads via `GET /api/company/settings` (ignores 404) and saves via `PUT /api/company/settings` with Authorization.
  - Kept only backend-mapped fields in the Company form: `name`/`gstin`/`state`/`state_code`/`invoice_series`/GST flags.
  - Removed UI-only fields to avoid mismatch.

### Verification Steps
- First save on a fresh tenant creates `CompanySettings` and returns 200; subsequent GET returns populated fields.
- Invoices/Purchases no longer fail due to missing company settings after first successful save.
- Network tab shows GET and PUT hitting `/api/company/settings` with expected payload and response.

### Takeaways
- For foundational settings, prefer upsert semantics to prevent bootstrap issues.
- Keep UI models aligned with backend contracts to avoid "saved but not persisted" confusion.
  - Handle 404 on GET as "not configured yet" for optional configuration screens.

---

## Date Filters: End-Date Inclusivity (UI)

### Context
- On `Purchase Payments` list (`frontend/src/pages/PurchasePayments.tsx`), the date range end boundary defaulted to midnight (00:00), unintentionally excluding payments that occurred later on the selected end day.

### Resolution
- Treat the end date as inclusive by setting the end-of-day boundary to `23:59:59.999` for comparisons.

### Testing Notes
- Validate with default last-30-days filter and with start == end date.
- Verify quick actions (Current FY, Cash Payment) still return correct rows.

### Rollback
- If over-inclusion is reported, revert to previous strict-end boundary or gate via a feature flag on the filter component.

---

## Cashflow Transactions Sorting and Reporting Consistency

### Context
- Cashflow transactions endpoint failed due to mixed `date` vs `datetime` types in `transaction_date` across sources (payments, purchase payments, expenses).
- Several report endpoints referenced a non-existent `payment_amount` on `Payment` instead of the correct `amount` attribute.

### Resolution
- Standardized the sort key to a single type by casting `Payment.payment_date` to `DateTime` in `backend/app/profitpath_service.py`.
- Replaced all `payment_amount` references in report handlers with `Payment.amount` in `backend/app/main_routers.py`.
- Corrected the frontend sidebar label to "Cashflow Analytics" for clarity.

### Verification Checklist
- `/api/cashflow/transactions` returns results with pagination; no TypeError on sort.
- Cashflow/Payments/Income report totals add up correctly; no attribute errors.
- UI shows "Cashflow Analytics" and navigates to the same route.

### Takeaways
- Normalize datatypes at query boundaries to avoid brittle downstream sorting/aggregation.
- Prefer model-defined attributes (`Payment.amount`) over inferred names; validate against ORM models (`backend/app/models.py`).
- Keep UI labels consistent with domain terminology to reduce confusion.

### Documentation & Release
- Updated `docs/CHANGELOG.md` with `1.50.0-stable` entry summarizing fixes.
- Bumped `VERSION` to `1.50.0-stable` for CI/CD pipelines and GitHub Actions tagging.
