# 🚀 ProfitPath Local Development Guide

This guide will help you set up and run ProfitPath locally using Docker with PostgreSQL.

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Git** for version control
- **Node.js** (optional, for local frontend development)

## 🐳 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd ipsc

# Run the automated setup script
./scripts/dev-setup.sh
```

This script will:
- ✅ Check Docker is running
- ✅ Clean up existing containers
- ✅ Build and start all services
- ✅ Migrate data from SQLite to PostgreSQL (if exists)
- ✅ Wait for all services to be ready
- ✅ Show you the access URLs

### Option 2: Manual Setup

```bash
# 1. Start the services
docker-compose -f docker-compose.local.yml up -d --build

# 2. Wait for PostgreSQL to be ready
docker exec profitpath-postgres-local pg_isready -U postgres

# 3. Run migration (if you have existing SQLite data)
cd backend
python3 migrate_to_postgresql.py
cd ..

# 4. Check services are running
docker-compose -f docker-compose.local.yml ps
```

## 🌐 Access URLs

Once everything is running, you can access:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Email Testing (MailHog)**: http://localhost:8025

## 🗄️ Database Information

- **Host**: localhost
- **Port**: 5432
- **Database**: profitpath
- **Username**: postgres
- **Password**: postgres

## 🔧 Useful Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.local.yml logs -f

# Specific service
docker-compose -f docker-compose.local.yml logs -f backend
docker-compose -f docker-compose.local.yml logs -f frontend
docker-compose -f docker-compose.local.yml logs -f postgres
```

### Stop Services
```bash
docker-compose -f docker-compose.local.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.local.yml restart
```

### Rebuild Services
```bash
docker-compose -f docker-compose.local.yml up -d --build
```

### Access Database
```bash
# Connect to PostgreSQL container
docker exec -it profitpath-postgres-local psql -U postgres -d profitpath

# Or use a local PostgreSQL client
psql -h localhost -p 5432 -U postgres -d profitpath
```

## 🐛 Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
docker exec profitpath-postgres-local pg_isready -U postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.local.yml logs postgres
```

### Backend Issues
```bash
# Check backend logs
docker-compose -f docker-compose.local.yml logs backend

# Restart backend only
docker-compose -f docker-compose.local.yml restart backend
```

### Frontend Issues
```bash
# Check frontend logs
docker-compose -f docker-compose.local.yml logs frontend

# Rebuild frontend
docker-compose -f docker-compose.local.yml up -d --build frontend
```

### Port Conflicts
If you get port conflicts, you can modify the ports in `docker-compose.local.yml`:

```yaml
ports:
  - "5433:5432"  # Change PostgreSQL port
  - "8001:8000"  # Change backend port
  - "5174:5173"  # Change frontend port
```

## 🔄 Migration from SQLite

If you have existing SQLite data, the migration script will automatically:

1. **Read** all tables from your SQLite database
2. **Create** corresponding tables in PostgreSQL
3. **Migrate** all data with proper type conversion
4. **Create** indexes for better performance

The migration script is located at `backend/migrate_to_postgresql.py` and runs automatically during setup.

## 📁 Project Structure

```
ipsc/
├── backend/                 # FastAPI backend
│   ├── app/                # Application code
│   ├── migrate_to_postgresql.py  # Migration script
│   └── Dockerfile          # Backend Docker image
├── frontend/               # React frontend
│   ├── src/               # Source code
│   └── Dockerfile         # Frontend Docker image
├── db/                    # Database initialization
│   └── init/              # PostgreSQL init scripts
├── scripts/               # Development scripts
│   └── dev-setup.sh       # Setup script
├── docker-compose.local.yml  # Local development compose
└── LOCAL_DEVELOPMENT.md   # This file
```

## 🧪 Testing

### Run Backend Tests
```bash
# Inside backend container
docker exec -it profitpath-backend-local bash
python -m pytest

# Or locally (if you have the environment set up)
cd backend
source ../.venv/bin/activate
python -m pytest
```

### Run Frontend Tests
```bash
# Inside frontend container
docker exec -it profitpath-frontend-local bash
npm test

# Or locally
cd frontend
npm test
```

## 🚀 Production Deployment

For production deployment, use the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the logs using the commands provided
3. Ensure Docker has enough resources allocated
4. Check that all required ports are available

## 🔄 Updates

To update your local environment:

```bash
# Pull latest changes
git pull

# Rebuild and restart services
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build
```

---

**Happy Coding! 🎉**
