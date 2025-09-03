#!/usr/bin/env bash
set -euo pipefail

# ProfitPath - Linux Production Packager
# - Builds frontend (Vite)
# - Freezes backend (FastAPI) into single binary with PyInstaller
# - Bundles nginx and generates nginx.conf from template
# - Produces a self-contained artifact with start/stop scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
FRONTEND_DIR="${ROOT}/frontend"
BACKEND_DIR="${ROOT}/backend"
SCRIPTS_DIR="${ROOT}/scripts"
TEMPLATES_DIR="${SCRIPTS_DIR}/templates"
ARTIFACTS_DIR="${ROOT}/artifacts/linux"
PACKAGE_DIR="${ARTIFACTS_DIR}/ProfitPath-Linux"
BUILD_VENV="${ARTIFACTS_DIR}/.build_venv"

PUBLIC_PORT=8080
BACKEND_PORT=8000
if [[ -f "${ROOT}/config/ports.json" ]]; then
  BACKEND_PORT=$(jq -r '.backend.port // 8000' "${ROOT}/config/ports.json") || BACKEND_PORT=8000
fi

# Ensure prerequisites
command -v npm >/dev/null 2>&1 || { echo "[ERROR] npm not found. Install Node.js LTS."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "[ERROR] python3 not found."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "[ERROR] jq not found. Install jq (JSON parser)."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "[ERROR] curl not found."; exit 1; }

# Clean previous package
rm -rf "${PACKAGE_DIR}" || true
mkdir -p "${PACKAGE_DIR}" "${ARTIFACTS_DIR}"

# 1) Build Frontend
pushd "${FRONTEND_DIR}" >/dev/null
npm install
npm run build
popd >/dev/null

mkdir -p "${PACKAGE_DIR}/web"
cp -R "${FRONTEND_DIR}/dist/"* "${PACKAGE_DIR}/web/"

# 2) Freeze Backend with PyInstaller
rm -rf "${BUILD_VENV}" || true
python3 -m venv "${BUILD_VENV}"
"${BUILD_VENV}/bin/pip" install --upgrade pip wheel setuptools
"${BUILD_VENV}/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"
"${BUILD_VENV}/bin/pip" install pyinstaller

pushd "${BACKEND_DIR}" >/dev/null
"${BUILD_VENV}/bin/pyinstaller" app/main.py --onefile --name profitpath-backend --noconfirm
popd >/dev/null

mkdir -p "${PACKAGE_DIR}/backend"
cp "${BACKEND_DIR}/dist/profitpath-backend" "${PACKAGE_DIR}/backend/profitpath-backend"
cp "${TEMPLATES_DIR}/backend.env.example" "${PACKAGE_DIR}/backend/.env"
chmod +x "${PACKAGE_DIR}/backend/profitpath-backend"

# 3) Bundle nginx
NGINX_DIR="${PACKAGE_DIR}/nginx"
NGINX_TGZ="${ARTIFACTS_DIR}/nginx.tar.gz"
NGINX_URL="${NGINX_TGZ_URL:-https://nginx.org/download/nginx-1.24.0.tar.gz}"

mkdir -p "${NGINX_DIR}"
if [[ ! -f "${NGINX_TGZ}" ]]; then
  echo "Downloading nginx..."
  curl -L "${NGINX_URL}" -o "${NGINX_TGZ}"
fi

# Prefer using system nginx if available; fall back to tarball extraction that requires build.
if command -v nginx >/dev/null 2>&1; then
  echo "Using system nginx binary."
  cp "$(command -v nginx)" "${NGINX_DIR}/nginx"
else
  echo "[WARN] System nginx not found. Expect nginx build steps separately or install nginx."
fi
mkdir -p "${NGINX_DIR}/conf" "${NGINX_DIR}/logs" "${NGINX_DIR}/temp"

# 4) Generate nginx.conf
NGINX_CONF_TMP="${NGINX_DIR}/conf/nginx.conf"
cp "${TEMPLATES_DIR}/nginx.conf.tpl" "${NGINX_CONF_TMP}"
sed -i "s#\${PACKAGE_ROOT}#${PACKAGE_DIR//\//\/}#g" "${NGINX_CONF_TMP}"
sed -i "s#\${PUBLIC_PORT}#${PUBLIC_PORT}#g" "${NGINX_CONF_TMP}"
sed -i "s#\${BACKEND_PORT}#${BACKEND_PORT}#g" "${NGINX_CONF_TMP}"

# 5) Runtime scripts
cat > "${PACKAGE_DIR}/start.sh" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
export PUBLIC_PORT=8080
export BACKEND_PORT=8000

echo "Starting ProfitPath Backend..."
( cd "$PKG_DIR/backend" && nohup ./profitpath-backend > "$PKG_DIR/backend/backend.out" 2>&1 & echo $! > "$PKG_DIR/backend/backend.pid" )
sleep 2

echo "Starting nginx..."
( cd "$PKG_DIR/nginx" && nohup ./nginx -p "$PKG_DIR/nginx" -c "$PKG_DIR/nginx/conf/nginx.conf" > "$PKG_DIR/nginx/nginx.out" 2>&1 & echo $! > "$PKG_DIR/nginx/nginx.pid" )

echo "Started. Open http://localhost:8080"
EOF
chmod +x "${PACKAGE_DIR}/start.sh"

cat > "${PACKAGE_DIR}/stop.sh" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
PKG_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Stopping nginx..."
if command -v pkill >/dev/null 2>&1; then
  pkill -f "nginx: master" || true
fi
if [[ -f "$PKG_DIR/nginx/nginx.pid" ]]; then
  kill "$(cat "$PKG_DIR/nginx/nginx.pid")" 2>/dev/null || true
  rm -f "$PKG_DIR/nginx/nginx.pid"
fi

echo "Stopping backend..."
if [[ -f "$PKG_DIR/backend/backend.pid" ]]; then
  kill "$(cat "$PKG_DIR/backend/backend.pid")" 2>/dev/null || true
  rm -f "$PKG_DIR/backend/backend.pid"
fi

echo "Stopped."
EOF
chmod +x "${PACKAGE_DIR}/stop.sh"

# Archive
TAR_PATH="${ARTIFACTS_DIR}/ProfitPath-Linux.tar.gz"
rm -f "${TAR_PATH}"
( cd "${ARTIFACTS_DIR}" && tar -czf "${TAR_PATH}" "$(basename "${PACKAGE_DIR}")" )

echo "✅ Packaging complete."
echo "- Folder: ${PACKAGE_DIR}"
echo "- Tarball: ${TAR_PATH}"