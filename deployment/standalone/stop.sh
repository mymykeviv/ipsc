#!/bin/bash

echo "🛑 Stopping ProfitPath..."
docker-compose down
echo "✅ ProfitPath stopped"
echo ""
echo "To start again, run: ./start.sh"
