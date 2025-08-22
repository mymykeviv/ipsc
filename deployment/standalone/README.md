# ProfitPath - Easy Deployment Package

## 🎉 Welcome to ProfitPath!

This package contains everything you need to run ProfitPath on your computer. 
**No technical knowledge required!**

## 🚀 Quick Start (3 Simple Steps)

### Step 1: Install Docker
- **Windows/Mac**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: Install Docker using your package manager

### Step 2: Start ProfitPath
- **Windows**: Double-click `start.bat`
- **Mac/Linux**: Double-click `start.sh` or run `./start.sh` in terminal

### Step 3: Open Your Browser
- Go to: **http://localhost**
- Login with: **admin** / **admin123**

**That's it!** 🎉

## 📱 What You Get

- **Web Application**: http://localhost
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432
- **Email Testing**: http://localhost:8025

## 🔧 Management Commands

### Windows Users:
```cmd
start.bat    - Start ProfitPath
stop.bat     - Stop ProfitPath
```

### Mac/Linux Users:
```bash
./start.sh   - Start ProfitPath
./stop.sh    - Stop ProfitPath
./test-deployment.sh - Test all services
```

### Windows Users:
```cmd
start.bat    - Start ProfitPath
stop.bat     - Stop ProfitPath
test-deployment.bat - Test all services
```

## 📊 System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **Docker**: Latest version

## 🆘 Troubleshooting

### "Docker is not running" Error
- Start Docker Desktop (Windows/Mac)
- Start Docker service (Linux)

### "Page not found" Error
- Wait 2-3 minutes for services to start
- Check if Docker containers are running: `docker-compose ps`

### "Port already in use" Error
- Stop other applications using ports 80, 8000, 5432, or 8025
- Or change ports in docker-compose.yml

### Check Service Status
```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs nginx
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mailhog
```

### Service Health Checks
```bash
# Check if nginx is serving the application
curl http://localhost

# Check if backend API is responding
curl http://localhost/api/health

# Check if MailHog is running
curl http://localhost:8025
```

### Common Issues and Solutions

#### Application not loading
1. Check if all containers are running: `docker-compose ps`
2. Check nginx logs: `docker-compose logs nginx`
3. Check frontend logs: `docker-compose logs frontend`
4. Ensure no other service is using port 80

#### API calls failing
1. Check backend logs: `docker-compose logs backend`
2. Verify database connection: `docker-compose logs database`
3. Check if backend is healthy: `curl http://localhost/api/health`

#### Email functionality not working
1. Check MailHog is running: `docker-compose logs mailhog`
2. Access MailHog UI: http://localhost:8025
3. Verify SMTP settings in backend logs

## 🔒 Security Notes

- Change default passwords in production
- This setup is for local use only
- For production, configure proper security settings
- Default database credentials are for development only

## 📞 Need Help?

- Check the logs: `docker-compose logs -f`
- Visit our GitHub repository for support
- Create an issue if you need help
- Check the troubleshooting section above

## 🗂️ Service Details

### Frontend (React Application)
- **Port**: 80 (via nginx)
- **Purpose**: User interface for the application
- **Technology**: React with Vite

### Backend (FastAPI)
- **Port**: 8000 (internal)
- **Purpose**: API server and business logic
- **Technology**: Python FastAPI

### Database (PostgreSQL)
- **Port**: 5432
- **Purpose**: Data storage
- **Technology**: PostgreSQL 16

### Nginx (Reverse Proxy)
- **Port**: 80
- **Purpose**: Traffic routing and load balancing
- **Features**: API proxying, static file serving, security headers

### MailHog (Email Testing)
- **Ports**: 1025 (SMTP), 8025 (Web UI)
- **Purpose**: Email testing and development
- **Features**: Catch all emails sent by the application
