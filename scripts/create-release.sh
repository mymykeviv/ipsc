#!/bin/bash

# ProfitPath Release Creation Script
# Usage: ./scripts/create-release.sh <version>
# Example: ./scripts/create-release.sh 1.42.0

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version number is required"
  echo ""
  echo "Usage: $0 <version>"
  echo "Example: $0 1.42.0"
  echo ""
  echo "This script will:"
  echo "1. Update the VERSION file"
  echo "2. Create a git tag"
  echo "3. Push to GitHub"
  echo "4. Trigger the automated build pipeline"
  exit 1
fi

echo "🚀 Creating ProfitPath release v$VERSION"
echo "========================================"

# Update VERSION file
echo "📝 Updating VERSION file..."
echo "$VERSION" > VERSION

# Commit and tag
echo "🏷️  Creating git tag..."
git add VERSION
git commit -m "Bump version to $VERSION"
git tag -a "v$VERSION" -m "Release version $VERSION"

# Push to GitHub
echo "📤 Pushing to GitHub..."
CURRENT_BRANCH=$(git branch --show-current)
git push origin $CURRENT_BRANCH
git push origin "v$VERSION"

echo ""
echo "✅ Release v$VERSION created successfully!"
echo ""
echo "🎯 What happens next:"
echo "1. GitHub Actions will automatically build the deployment packages"
echo "2. Docker images will be created and pushed to registry"
echo "3. User-friendly deployment packages will be generated"
echo "4. A GitHub release will be created with download links"
echo ""
echo "⏳ Check the Actions tab for build progress:"
echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')/actions"
echo ""
echo "🎉 Users will be able to download and run ProfitPath with just Docker!"
