#!/bin/bash

# Backup Script for CASHFLOW Production
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${GREEN}💾 Starting CASHFLOW Production Backup${NC}"
echo -e "${YELLOW}Backup Date: ${DATE}${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo -e "${YELLOW}🗄️ Creating database backup...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump -U postgres cashflow > "$BACKUP_DIR/db_backup_$DATE.sql"

# Compress database backup
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Uploads backup
echo -e "${YELLOW}📁 Creating uploads backup...${NC}"
if [ -d "./backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" -C ./backend uploads
else
    echo -e "${YELLOW}⚠️ No uploads directory found${NC}"
fi

# Configuration backup
echo -e "${YELLOW}⚙️ Creating configuration backup...${NC}"
tar -czf "$BACKUP_DIR/config_backup_$DATE.tar.gz" \
    docker-compose.prod.yml \
    .env.prod \
    backend/env.example \
    monitoring/prometheus.yml \
    frontend/nginx.conf

# Create backup manifest
cat > "$BACKUP_DIR/backup_manifest_$DATE.txt" << EOF
CASHFLOW Production Backup
Date: $(date)
Backup ID: $DATE

Files:
- db_backup_$DATE.sql.gz (Database)
- uploads_backup_$DATE.tar.gz (Uploads)
- config_backup_$DATE.tar.gz (Configuration)

Services:
$(docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}")

System Info:
$(uname -a)
$(docker --version)
$(docker-compose --version)
EOF

# Clean old backups (keep last 7 days)
echo -e "${YELLOW}🧹 Cleaning old backups...${NC}"
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.txt" -mtime +7 -delete

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${YELLOW}📁 Backup location: $BACKUP_DIR${NC}"
echo -e "${YELLOW}📋 Manifest: backup_manifest_$DATE.txt${NC}"
