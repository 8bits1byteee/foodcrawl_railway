@echo off
REM Railway Deployment Quick Start Script for Windows
REM This script automates the deployment setup to Railway

setlocal enabledelayedexpansion

color 0B
echo.
echo ========================================
echo Railway Deployment Quick Start
echo Estancia Food Crawl
echo ========================================
echo.

REM Check if Railway CLI is installed
echo Checking prerequisites...

where railway >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [X] Railway CLI not found
    color 0B
    echo Install it with: npm install -g @railway/cli
    exit /b 1
)
echo [OK] Railway CLI found

where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [X] Git not found
    exit /b 1
)
echo [OK] Git found

REM Check git status
echo.
echo Checking Git repository...

if not exist .git (
    color 0C
    echo [X] Not a git repository
    color 0B
    echo Run: git init ^&^& git add . ^&^& git commit -m "Initial commit"
    exit /b 1
)
echo [OK] Git repository detected

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.

echo 1. Ensure you're logged into Railway:
echo    railway login
echo.

echo 2. Initialize Railway project in this directory:
echo    railway init
echo.

echo 3. Add MySQL database service:
echo    railway add
echo    (Select 'MySQL')
echo.

echo 4. Set environment variables in Railway Dashboard:
echo    - MAPBOX_ACCESS_TOKEN
echo    - GOOGLE_CLIENT_ID (optional)
echo    - GOOGLE_CLIENT_SECRET (optional)
echo.

echo 5. Deploy to Railway:
echo    git push railway main
echo    or
echo    railway deploy
echo.

echo 6. After deployment, run database migrations:
echo    railway exec php railway_migrate.php
echo.

echo 7. View logs:
echo    railway logs --follow
echo.

echo For detailed instructions, see: RAILWAY_DEPLOYMENT.md
echo.

color 07
