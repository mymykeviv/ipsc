ProfitPath - Windows Self-Contained Package

Contents:
- web/                Static frontend build (Vite)
- backend/profitpath-backend.exe  FastAPI backend executable
- backend/.env        Runtime configuration file (edit as needed)
- nginx/              NGINX for serving web and proxying /api
- start.bat           Starts backend and NGINX, then opens browser
- stop.bat            Stops NGINX and backend

Default Ports:
- Public (NGINX): 8080
- Backend (FastAPI): 8000

How to Run:
1) Double-click start.bat
2) Your browser will open http://localhost:8080
3) To stop, double-click stop.bat

Configuration:
- Edit backend/.env to customize database URL, multi-tenancy, etc.
- If you change ports, update config/ports.json in repo and repackage, or edit nginx/conf/nginx.conf and backend/.env manually in the package.

Notes:
- First startup may initialize the database (seeding behavior per backend defaults).
- Ensure ports 8080 and 8000 are not in use by other apps.