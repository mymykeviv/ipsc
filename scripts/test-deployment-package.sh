#!/bin/bash

# Test script to verify deployment package structure
# This script checks that all necessary files exist and are properly formatted

echo "🧪 Testing Deployment Package Structure"
echo "========================================"

# Check if deployment directory exists
if [ ! -d "deployment/standalone" ]; then
  echo "❌ Error: deployment/standalone directory not found"
  exit 1
fi

cd deployment/standalone

# Check required files
required_files=(
  "docker-compose.yml"
  "start.sh"
  "start.bat"
  "stop.sh"
  "stop.bat"
  "README.md"
)

echo "📋 Checking required files..."
for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    exit 1
  fi
done

# Check file permissions
echo ""
echo "🔐 Checking file permissions..."
if [ -x "start.sh" ]; then
  echo "✅ start.sh is executable"
else
  echo "❌ start.sh is not executable"
  exit 1
fi

if [ -x "stop.sh" ]; then
  echo "✅ stop.sh is executable"
else
  echo "❌ stop.sh is not executable"
  exit 1
fi

# Check docker-compose.yml syntax
echo ""
echo "🐳 Checking docker-compose.yml syntax..."
if docker-compose config > /dev/null 2>&1; then
  echo "✅ docker-compose.yml is valid"
else
  echo "❌ docker-compose.yml has syntax errors"
  exit 1
fi

# Check README.md content
echo ""
echo "📖 Checking README.md content..."
if grep -q "Quick Start" README.md; then
  echo "✅ README.md contains Quick Start section"
else
  echo "❌ README.md missing Quick Start section"
  exit 1
fi

if grep -q "http://localhost" README.md; then
  echo "✅ README.md contains localhost URL"
else
  echo "❌ README.md missing localhost URL"
  exit 1
fi

# Check startup scripts
echo ""
echo "🚀 Checking startup scripts..."
if grep -q "docker info" start.sh; then
  echo "✅ start.sh checks Docker status"
else
  echo "❌ start.sh missing Docker check"
  exit 1
fi

if grep -q "docker info" start.bat; then
  echo "✅ start.bat checks Docker status"
else
  echo "❌ start.bat missing Docker check"
  exit 1
fi

echo ""
echo "🎉 All tests passed! Deployment package is ready."
echo ""
echo "📦 Package contents:"
ls -la
echo ""
echo "📋 Next steps:"
echo "1. Run: ./scripts/create-release.sh 1.42.0"
echo "2. Check GitHub Actions for build progress"
echo "3. Download and test the generated package"
