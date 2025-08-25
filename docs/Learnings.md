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
