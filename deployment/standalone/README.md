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
- Check if Docker containers are running

### "Port already in use" Error
- Stop other applications using ports 80, 8000, or 5432
- Or change ports in docker-compose.yml

## 🔒 Security Notes

- Change default passwords in production
- This setup is for local use only
- For production, configure proper security settings

## 📞 Need Help?

- Check the logs: `docker-compose logs -f`
- Visit our GitHub repository for support
- Create an issue if you need help
