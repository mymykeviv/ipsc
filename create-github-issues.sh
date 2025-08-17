#!/bin/bash

# GitHub Issues Creation Script for Invoice Template System
# Usage: ./create-github-issues.sh

# Configuration
REPO_OWNER="mymykeviv"
REPO_NAME="ipsc"
GITHUB_TOKEN=""  # Add your GitHub token here

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Creating GitHub Issues for Invoice Template System...${NC}"

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: Please add your GitHub token to the script${NC}"
    echo "You can get a token from: https://github.com/settings/tokens"
    exit 1
fi

# Function to create issue
create_issue() {
    local title="$1"
    local body_file="$2"
    local labels="$3"
    
    echo -e "${GREEN}Creating issue: $title${NC}"
    
    # Read the body from file
    body=$(cat "$body_file")
    
    # Create the issue using GitHub API
    response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -d "{
            \"title\": \"$title\",
            \"body\": $(echo "$body" | jq -R -s .),
            \"labels\": [$labels]
        }" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/issues")
    
    # Check if issue was created successfully
    if echo "$response" | jq -e '.id' > /dev/null; then
        issue_number=$(echo "$response" | jq -r '.number')
        issue_url=$(echo "$response" | jq -r '.html_url')
        echo -e "${GREEN}✓ Issue created successfully!${NC}"
        echo -e "Issue #$issue_number: $issue_url"
    else
        echo -e "${RED}✗ Failed to create issue${NC}"
        echo "$response"
    fi
    
    echo ""
}

# Create issues
echo "Creating Issue 1: Invoice Template System Foundation"
create_issue \
    "Invoice Template System Foundation" \
    "github-issues/invoice-template-system-foundation.md" \
    "\"enhancement\", \"invoice\", \"template-system\", \"ui/ux\""

echo "Creating Issue 2: Professional Invoice Template Implementation"
create_issue \
    "Professional Invoice Template Implementation" \
    "github-issues/professional-invoice-template.md" \
    "\"enhancement\", \"invoice\", \"template\", \"ui/ux\", \"design\""

echo "Creating Issue 3: Template Customization System"
create_issue \
    "Template Customization System" \
    "github-issues/template-customization-system.md" \
    "\"enhancement\", \"invoice\", \"customization\", \"ui/ux\", \"design-system\""

echo "Creating Issue 4: Template Management and Settings Integration"
create_issue \
    "Template Management and Settings Integration" \
    "github-issues/template-management-settings.md" \
    "\"enhancement\", \"invoice\", \"settings\", \"management\", \"ui/ux\""

echo -e "${GREEN}All issues have been created!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the created issues in your GitHub repository"
echo "2. Assign team members to the issues"
echo "3. Add the issues to your project board"
echo "4. Set up milestones and sprints"
echo ""
echo -e "${YELLOW}Repository URL:${NC} https://github.com/$REPO_OWNER/$REPO_NAME"
