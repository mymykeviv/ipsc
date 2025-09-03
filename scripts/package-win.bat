@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ProfitPath - Windows Production Packager
REM - Builds frontend (Vite)
REM - Freezes backend (FastAPI) into single EXE with PyInstaller
REM - Bundles NGINX (Windows) and generates nginx.conf from template
REM - Produces a self-contained artifact with start/stop scripts

REM Resolve repo root (.. from scripts dir)
set SCRIPT_DIR=%~dp0
for %%I in ("%SCRIPT_DIR%..") do set ROOT=%%~fI

set FRONTEND_DIR=%ROOT%\frontend
set BACKEND_DIR=%ROOT%\backend
set SCRIPTS_DIR=%ROOT%\scripts
set TEMPLATES_DIR=%SCRIPTS_DIR%\templates
set ARTIFACTS_DIR=%ROOT%\artifacts\windows
set PACKAGE_DIR=%ARTIFACTS_DIR%\ProfitPath-Windows
set BUILD_VENV=%ARTIFACTS_DIR%\.build_venv

REM Ports
set PUBLIC_PORT=8080
set BACKEND_PORT=

REM Try to read backend port from config/ports.json
set PORTS_JSON=%ROOT%\config\ports.json
if exist "%PORTS_JSON%" (
  for /f "usebackq tokens=*" %%A in (`powershell -NoProfile -Command "(Get-Content -Raw '%PORTS_JSON%') | ConvertFrom-Json | Select-Object -ExpandProperty backend | Select-Object -ExpandProperty port"`) do set BACKEND_PORT=%%A
)
if "%BACKEND_PORT%"=="" set BACKEND_PORT=8000

REM Ensure prerequisites
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found in PATH. Please install Node.js LTS and ensure npm is available.
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  where py >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] Python not found in PATH. Please install Python 3.10+ and ensure 'python' or 'py' is available.
    exit /b 1
  ) else (
    set PYTHON=py -3
  )
) else (
  set PYTHON=python
)

REM Clean previous package
if exist "%PACKAGE_DIR%" (
  echo Cleaning previous package at %PACKAGE_DIR%
  rmdir /s /q "%PACKAGE_DIR%"
)
mkdir "%PACKAGE_DIR%" 2>nul
mkdir "%ARTIFACTS_DIR%" 2>nul

REM 1) Build Frontend (Vite)
echo.
echo [1/5] Building frontend...
pushd "%FRONTEND_DIR%"
call npm install || (echo [ERROR] npm install failed ^& popd ^& exit /b 1)
call npm run build || (echo [ERROR] Frontend build failed ^& popd ^& exit /b 1)
popd

REM Copy frontend dist into package/web
mkdir "%PACKAGE_DIR%\web" 2>nul
xcopy /e /i /y "%FRONTEND_DIR%\dist\*" "%PACKAGE_DIR%\web\" >nul

REM 2) Freeze Backend with PyInstaller (onefile)
echo.
echo [2/5] Freezing backend with PyInstaller...
REM Create ephemeral venv for clean build
if exist "%BUILD_VENV%" rmdir /s /q "%BUILD_VENV%"
%PYTHON% -m venv "%BUILD_VENV%" || (echo [ERROR] Failed to create build venv ^& exit /b 1)
set VENV_PY="%BUILD_VENV%\Scripts\python.exe"
set VENV_PIP="%BUILD_VENV%\Scripts\pip.exe"

%VENV_PIP% install --upgrade pip wheel setuptools >nul || (echo [ERROR] Failed to upgrade pip ^& exit /b 1)
%VENV_PIP% install -r "%BACKEND_DIR%\requirements.txt" >nul || (echo [ERROR] Failed to install backend requirements ^& exit /b 1)
%VENV_PIP% install pyinstaller >nul || (echo [ERROR] Failed to install PyInstaller ^& exit /b 1)

pushd "%BACKEND_DIR%"
REM Include dynamic handlers and C-extension modules used by passlib/bcrypt
"%BUILD_VENV%\Scripts\pyinstaller.exe" app\main.py --onefile --name profitpath-backend --noconfirm ^
  --collect-submodules passlib.handlers ^
  --collect-submodules passlib ^
  --collect-submodules bcrypt ^
  --hidden-import passlib.handlers.bcrypt ^
  --hidden-import passlib.hash ^
  --hidden-import passlib.context || (echo [ERROR] PyInstaller failed ^& popd ^& exit /b 1)
popd

REM Copy backend executable and env template
mkdir "%PACKAGE_DIR%\backend" 2>nul
copy /y "%BACKEND_DIR%\dist\profitpath-backend.exe" "%PACKAGE_DIR%\backend\profitpath-backend.exe" >nul || (echo [ERROR] Backend executable not found ^& exit /b 1)

REM If backend .env template exists, copy it; otherwise, generate a safe default
if exist "%TEMPLATES_DIR%\backend.env.example" (
  copy /y "%TEMPLATES_DIR%\backend.env.example" "%PACKAGE_DIR%\backend\.env" >nul
) else (
  (
    echo # ProfitPath Backend .env (generated)
    echo # Safe defaults suitable for local packaging
    echo LOG_LEVEL=INFO
    echo ALLOWED_ORIGINS=["http://localhost:%PUBLIC_PORT%","http://localhost:5173","http://localhost:%BACKEND_PORT%"]
    echo # SECURITY_ENABLED and DATABASE_OPTIMIZATION_ENABLED are controlled at runtime; leave unset for defaults
  ) > "%PACKAGE_DIR%\backend\.env"
)

REM 3) Bundle NGINX (Windows)
echo.
echo [3/5] Preparing NGINX...
set NGINX_DIR=%PACKAGE_DIR%\nginx
set NGINX_ZIP=%ARTIFACTS_DIR%\nginx.zip
set NGINX_URL=%NGINX_ZIP_URL%
if "%NGINX_URL%"=="" set NGINX_URL=https://nginx.org/download/nginx-1.24.0.zip

if not exist "%NGINX_ZIP%" (
  echo Downloading NGINX from %NGINX_URL%
  powershell -NoProfile -Command "Invoke-WebRequest -UseBasicParsing -Uri '%NGINX_URL%' -OutFile '%NGINX_ZIP%'" || (echo [ERROR] Failed to download NGINX ^& exit /b 1)
) else (
  echo Using cached NGINX zip: %NGINX_ZIP%
)

if exist "%NGINX_DIR%" rmdir /s /q "%NGINX_DIR%"
mkdir "%NGINX_DIR%" 2>nul

REM Extract zip (PowerShell)
powershell -NoProfile -Command "Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::ExtractToDirectory('%NGINX_ZIP%', '%NGINX_DIR%')" || (echo [ERROR] Failed to extract NGINX ^& exit /b 1)

REM After extraction, nginx folder name varies (e.g., nginx-1.24.0). Move contents up one level.
for /d %%D in ("%NGINX_DIR%\nginx-*") do (
  xcopy /e /i /y "%%D\*" "%NGINX_DIR%\" >nul
  rmdir /s /q "%%D"
)

REM Ensure conf directory exists
if not exist "%NGINX_DIR%\conf" mkdir "%NGINX_DIR%\conf"

REM 4) Generate nginx.conf from template with proper paths and ports
echo.
echo [4/5] Generating nginx.conf...
set NGINX_CONF_TMP=%NGINX_DIR%\conf\nginx.conf
copy /y "%TEMPLATES_DIR%\nginx.conf.tpl" "%NGINX_CONF_TMP%" >nul || (echo [ERROR] nginx.conf template missing ^& exit /b 1)

REM Render variables using PowerShell string replace (single line to avoid caret issues)
powershell -NoProfile -Command "$pkg=(Resolve-Path '%PACKAGE_DIR%').Path -replace '\\','/';$conf='%NGINX_CONF_TMP%';$c=Get-Content -Raw $conf;$c=$c -replace '\$\{PACKAGE_ROOT\}',$pkg -replace '\$\{PUBLIC_PORT\}','%PUBLIC_PORT%' -replace '\$\{BACKEND_PORT\}','%BACKEND_PORT%';[IO.File]::WriteAllText($conf,$c)"

REM 5) Write start/stop scripts and packaged README
echo.
echo [5/5] Writing runtime scripts...
(
  echo @echo off
  echo setlocal ENABLEDELAYEDEXPANSION
  echo set PUBLIC_PORT=%PUBLIC_PORT%
  echo set BACKEND_PORT=%BACKEND_PORT%
  echo set PKG_DIR=%%~dp0
  echo echo Starting ProfitPath Backend...
  echo start "ProfitPath Backend" /D "%%PKG_DIR%%backend" "%%PKG_DIR%%backend\profitpath-backend.exe"
  echo timeout /t 2 ^>nul
  echo echo Starting NGINX...
  echo pushd "%%PKG_DIR%%nginx"
  echo start "ProfitPath NGINX" nginx.exe -p "%%PKG_DIR%%nginx" -c "%%PKG_DIR%%nginx\conf\nginx.conf"
  echo popd
  echo echo Opening browser at http://localhost:%PUBLIC_PORT%
  echo start "" http://localhost:%PUBLIC_PORT%
  echo echo All services started. Use stop.bat to stop.
) > "%PACKAGE_DIR%\start.bat"

(
  echo @echo off
  echo setlocal ENABLEDELAYEDEXPANSION
  echo set PKG_DIR=%%~dp0
  echo echo Stopping NGINX...
  echo pushd "%%PKG_DIR%%nginx"
  echo nginx.exe -p "%%PKG_DIR%%nginx" -s quit
  echo popd
  echo echo Stopping ProfitPath Backend...
  echo taskkill /im profitpath-backend.exe /f ^>nul 2^>^&1
  echo echo Stopped.
) > "%PACKAGE_DIR%\stop.bat"

REM Package README
copy /y "%TEMPLATES_DIR%\PACKAGE_README_WIN.txt" "%PACKAGE_DIR%\README.txt" >nul

REM Zip artifact
set ZIP_PATH=%ARTIFACTS_DIR%\ProfitPath-Windows.zip
if exist "%ZIP_PATH%" del /f /q "%ZIP_PATH%"
REM Use .NET ZipFile for more reliable compression
powershell -NoProfile -Command "Add-Type -A 'System.IO.Compression.FileSystem'; if (Test-Path '%ZIP_PATH%'){Remove-Item -Force '%ZIP_PATH%'}; [IO.Compression.ZipFile]::CreateFromDirectory('%PACKAGE_DIR%', '%ZIP_PATH%')" || echo [WARN] Failed to zip artifact, files are in %PACKAGE_DIR%

echo.
echo ✅ Packaging complete.
echo - Folder: %PACKAGE_DIR%
echo - Zip: %ZIP_PATH%

echo To run: Double-click start.bat in the package folder.
exit /b 0