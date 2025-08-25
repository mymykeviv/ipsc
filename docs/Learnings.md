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
