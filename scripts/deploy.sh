#!/bin/bash

# Production Deployment Script for CASHFLOW
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

echo -e "${GREEN}🚀 Starting CASHFLOW Production Deployment${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"

# Check if .env.prod exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found${NC}"
    echo -e "${YELLOW}Please create $ENV_FILE with production environment variables${NC}"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "SECRET_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down --remove-orphans

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest images...${NC}"
docker-compose -f "$COMPOSE_FILE" pull

# Build and start services
echo -e "${YELLOW}🔨 Building and starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d --build

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
    echo -e "${RED}❌ Some services are unhealthy${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    exit 1
fi

# Run database migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T backend python -m alembic upgrade head

# Test application
echo -e "${YELLOW}🧪 Testing application...${NC}"
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is responding${NC}"
else
    echo -e "${RED}❌ Application is not responding${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📊 Application URL: http://localhost${NC}"
echo -e "${YELLOW}📈 Monitoring: http://localhost:9090 (Prometheus)${NC}"
echo -e "${YELLOW}📊 Dashboard: http://localhost:3000 (Grafana)${NC}"
