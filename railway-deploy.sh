#!/bin/bash
# Railway Deployment Quick Start Script
# This script automates the deployment setup to Railway

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Railway Deployment Quick Start${NC}"
echo -e "${BLUE}Estancia Food Crawl${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Railway CLI is installed
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not found${NC}"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi
echo -e "${GREEN}✓ Railway CLI found${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git found${NC}"

# Check git status
echo ""
echo -e "${YELLOW}Checking Git repository...${NC}"

if [ ! -d .git ]; then
    echo -e "${RED}✗ Not a git repository${NC}"
    echo "Run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi
echo -e "${GREEN}✓ Git repository detected${NC}"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
    echo "Commit your changes before deploying: git add . && git commit -m 'Your message'"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps:${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "1. Ensure you're logged into Railway:"
echo "   ${YELLOW}railway login${NC}"
echo ""

echo "2. Initialize Railway project in this directory:"
echo "   ${YELLOW}railway init${NC}"
echo ""

echo "3. Add MySQL database service:"
echo "   ${YELLOW}railway add${NC}"
echo "   (Select 'MySQL')"
echo ""

echo "4. Set environment variables in Railway Dashboard:"
echo "   - MAPBOX_ACCESS_TOKEN"
echo "   - GOOGLE_CLIENT_ID (optional)"
echo "   - GOOGLE_CLIENT_SECRET (optional)"
echo ""

echo "5. Deploy to Railway:"
echo "   ${YELLOW}git push railway main${NC}"
echo "   or"
echo "   ${YELLOW}railway deploy${NC}"
echo ""

echo "6. After deployment, run database migrations:"
echo "   ${YELLOW}railway exec php railway_migrate.php${NC}"
echo ""

echo "7. View logs:"
echo "   ${YELLOW}railway logs --follow${NC}"
echo ""

echo -e "${GREEN}For detailed instructions, see: RAILWAY_DEPLOYMENT.md${NC}"
echo ""
