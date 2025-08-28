# Deployment Builds and Packaging

This document describes the supported build types, their docker-compose mappings, and how the release scripts package artifacts.

## Build Types

- docker-dev
  - Purpose: Local development with hot-reload and maximum debugging
  - Compose: `deployment/docker/docker-compose.dev.yml`
  - Push images: No

- docker-prod
  - Purpose: Local "prod-like" verification with maximum debugging enabled
  - Compose: `deployment/docker/docker-compose.prod.local.yml`
  - Push images: No

- docker-prod-lite
  - Purpose: Local "prod-lite" verification for low-resource systems; single-tenant
  - Compose: `deployment/docker/docker-compose.prod-lite.local.yml`
  - Push images: No

- production
  - Purpose: Distributable production build (full features)
  - Compose: `deployment/docker/docker-compose.prod.yml`
  - Push images: Yes

- prod-lite
  - Purpose: Distributable production build for low-resource/single-tenant deployments
  - Compose: `deployment/docker/docker-compose.prod-lite.yml`
  - Push images: Yes

## Script Behavior

- `scripts/create-release.sh`
  - Accepts `--build-type` and maps to the compose files above (see mapping).
  - Runs preflight checks (frontend typecheck/lint/build, backend migrations) unless `--skip-preflight`.
  - Updates VERSION and tags.

- `scripts/release-packager.sh`
  - Accepts `--build-type` and maps to compose files above.
  - Normalizes to the repository root to resolve compose paths reliably.
  - Builds backend/frontend images; pushes for production/prod-lite.
  - Packages a `deployment-package/` with selected `docker-compose.yml`, `nginx.conf`, and start/stop scripts.
  - Fails fast if the compose file is missing. To allow the previous embedded fallback, pass `--allow-embedded-compose`.
  - Performs post-package sanity checks:
    - `production`/`docker-prod`: DEBUG expected to be false.
    - `prod-lite`/`docker-prod-lite`: MULTI_TENANT_ENABLED expected to be false.
    - `docker-dev`: LOG_LEVEL expected to be DEBUG.

## Rationale for Removing Embedded Compose by Default

- Prevents configuration drift between packaged artifacts and reference compose files.
- Ensures build-type semantics (debug flags, tenancy) come from the authoritative files.
- Reduces security risk from permissive inline defaults.

## Usage Examples

- Local development:
  ```bash
  ./scripts/create-release.sh --build-type docker-dev 1.2.3
  ```

- Local prod-like verification (full features, debug enabled):
  ```bash
  ./scripts/create-release.sh --build-type docker-prod 1.2.3
  ```

- Local prod-lite verification (single-tenant, debug enabled):
  ```bash
  ./scripts/create-release.sh --build-type docker-prod-lite 1.2.3
  ```

- Distributable production package:
  ```bash
  ./scripts/release-packager.sh --build-type production 1.2.3 mydockerhub
  ```

- Distributable prod-lite package:
  ```bash
  ./scripts/release-packager.sh --build-type prod-lite 1.2.3 mydockerhub
  ```

- Emergency fallback to embedded compose (not recommended):
  ```bash
  ./scripts/release-packager.sh --allow-embedded-compose --build-type production 1.2.3 mydockerhub
  ```

## CI Recommendations

- Add a workflow job to run the packager for each build type with `--quick` and verify that `deployment-package/docker-compose.yml` was copied from a reference file (i.e., do not pass `--allow-embedded-compose`).
- Optionally parse and assert expected flags per build type (DEBUG/MULTI_TENANT_ENABLED).

## Credentials and Registries

### Docker Hub (CI and local)

- Add repository secrets in GitHub:
  - Navigate to: GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
  - Add the following secrets:
    - `DOCKERHUB_USERNAME` – your Docker Hub username
    - `DOCKERHUB_TOKEN` – a Docker Hub access token (preferred over password)

- Local login (developer machine):
  ```bash
  docker login -u "$DOCKERHUB_USERNAME"
  # enter your Docker Hub token when prompted
  ```

### GitHub Container Registry (GHCR)

- You can push to GHCR using either a Personal Access Token (PAT) with `write:packages` or the built-in `GITHUB_TOKEN` in Actions with `packages: write` permission.
- Local login (PAT):
  ```bash
  echo "$GHCR_PAT" | docker login ghcr.io -u "<github_username>" --password-stdin
  ```
  In GitHub Actions, prefer:
  ```yaml
  permissions:
    contents: read
    packages: write
  # then
  - run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin
  ```

## Local Production Builds that Push to Docker Hub

`scripts/release-packager.sh` is Docker Hub–specific and will push images for distributable build types.

- Full production build + push + package:
  ```bash
  ./scripts/release-packager.sh --build-type production 1.2.3 "$DOCKERHUB_USERNAME"
  ```

- Prod-lite build + push + package (single-tenant):
  ```bash
  ./scripts/release-packager.sh --build-type prod-lite 1.2.3 "$DOCKERHUB_USERNAME"
  ```

Outputs:
- Docker images pushed: `profitpath-backend:1.2.3` and `profitpath-frontend:1.2.3` (and `latest`) under your Docker Hub namespace.
- Artifacts in `deployment-package/` with `docker-compose.yml`, `nginx.conf`, and start/stop scripts ready to run on any Docker host.

Running locally with the packaged artifacts:
```bash
cd deployment-package
./start.sh   # brings up database, backend, frontend, nginx
# open http://localhost
```

Note: For local prod-like debugging without push, use `--build-type docker-prod` or `docker-prod-lite` with `scripts/create-release.sh`.

## Push to GitHub Container Registry (GHCR)

`scripts/release-packager.sh` does not target GHCR. Use the following approaches.

### CLI (local) example
```bash
# login
echo "$GHCR_PAT" | docker login ghcr.io -u "<github_username>" --password-stdin

# backend
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/<org_or_user>/ipsc-backend:1.2.3 \
  -f backend/Dockerfile --push backend

# frontend
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/<org_or_user>/ipsc-frontend:1.2.3 \
  -f frontend/Dockerfile.optimized --push frontend
```

### GitHub Actions example
```yaml
name: Publish GHCR Images
on:
  workflow_dispatch:
    inputs:
      version:
        description: Image version
        required: true
permissions:
  contents: read
  packages: write
jobs:
  publish-ghcr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Login to GHCR
        run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin
      - name: Build and push backend
        run: |
          docker buildx build --platform linux/amd64,linux/arm64 \
            -t ghcr.io/${{ github.repository_owner }}/ipsc-backend:${{ github.event.inputs.version }} \
            -f backend/Dockerfile --push backend
      - name: Build and push frontend
        run: |
          docker buildx build --platform linux/amd64,linux/arm64 \
            -t ghcr.io/${{ github.repository_owner }}/ipsc-frontend:${{ github.event.inputs.version }} \
            -f frontend/Dockerfile.optimized --push frontend
```

To use GHCR images with Docker Compose, update image references in your compose file to `ghcr.io/<owner>/ipsc-backend:<tag>` and `ghcr.io/<owner>/ipsc-frontend:<tag>`.

## Deprecations

- The legacy standalone stack under `deployment/standalone/` is deprecated. Scripts now use `deployment/docker/` exclusively.
- Before removing deprecated files, perform a repository-wide reference check (scripts/CI/docs). Update docs accordingly.
