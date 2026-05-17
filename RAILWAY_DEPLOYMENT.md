# Railway Deployment Guide - Estancia Food Crawl

This guide will help you deploy the Estancia Food Crawl application to Railway.

## Prerequisites

- A Railway account (https://railway.app)
- GitHub account (for connecting your repository)
- Git installed on your machine
- MySQL CLI tool (optional, for database management)

## Step 1: Prepare Your Repository

### 1.1 Update Git Remote

```bash
# Add Railway as a remote (if not already done)
git remote add railway https://github.com/your-username/foodcrawl1.git
```

### 1.2 Review .gitignore

Make sure your `.gitignore` includes:

```
.env
.env.local
.venv/
node_modules/
.DS_Store
images/attachments/*
*.log
```

## Step 2: Create Railway Project

### 2.1 Via Railway Dashboard

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"GitHub Repo"**
4. Connect your GitHub account and select `foodcrawl1` repository
5. Railway will automatically detect PHP and create a basic configuration

### 2.2 Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd c:\xampp\htdocs\foodcrawl1
railway init
```

## Step 3: Add MySQL Database Service

### 3.1 In Railway Dashboard

1. Open your project
2. Click **"+ New"** → **"Database"**
3. Select **"MySQL"**
4. Railway will create a MySQL instance and provide connection variables:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### 3.2 Via Railway CLI

```bash
railway add mysql
```

## Step 4: Configure Environment Variables

### 4.1 Set Railway Variables

In Railway Dashboard, go to **Variables** and add:

```
# Database (auto-filled by MySQL plugin)
DB_HOST=${MYSQL_HOST}
DB_PORT=${MYSQL_PORT}
DB_NAME=${MYSQL_DATABASE}
DB_USER=${MYSQL_USER}
DB_PASS=${MYSQL_PASSWORD}

# Application
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Asia/Manila

# Mapbox Token
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4.2 Get Your Tokens

**Mapbox Token:**
1. Go to https://account.mapbox.com/tokens/
2. Create a new token with public scope
3. Copy and paste into `MAPBOX_ACCESS_TOKEN`

**Google OAuth (optional):**
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add Railway URL to authorized redirect URIs: `https://your-app.railway.app`

## Step 5: Database Setup

### 5.1 Initialize Database from SQL Files

Once MySQL is connected, you need to import the database schema:

#### Option A: Using Railway Database GUI

1. In Railway Dashboard, click on MySQL service
2. Click **"Data"** tab
3. Upload `food_crawl.sql` through the interface

#### Option B: Using Railway Shell

```bash
# Access Railway shell
railway shell mysql

# Then run:
mysql -h ${MYSQL_HOST} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} < food_crawl.sql
```

#### Option C: SSH into App and Run

```bash
# Connect via SSH
railway shell web

# Navigate to project
cd /app

# Run migration script
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < food_crawl.sql
```

### 5.2 Verify Database Connection

Create a test file to verify connection (optional):

```php
<?php
require_once 'includes/config_railway.php';
$db = getDB();
if ($db) {
    echo "✓ Database connected successfully!";
} else {
    echo "✗ Database connection failed!";
}
?>
```

## Step 6: Update Application Config

### 6.1 Modify config.php

The application already has config loading, but ensure it uses `config_railway.php` if needed:

```php
// At the top of includes/config.php, add:
if (getenv('RAILWAY_ENVIRONMENT_NAME')) {
    require_once __DIR__ . '/config_railway.php';
}
```

### 6.2 File Uploads Configuration

Create a persistent volume for uploaded files:

1. In Railway Dashboard, go to **Volumes**
2. Click **"+ New"**
3. Mount point: `/app/images`
4. Size: 1GB (or more as needed)

## Step 7: Deploy

### 7.1 Push to Production

```bash
# Via Git
git push railway main

# Or via Railway CLI
railway deploy
```

### 7.2 Monitor Deployment

```bash
# Watch logs in real-time
railway logs --follow

# Or check in Dashboard → Logs
```

## Step 8: Post-Deployment Verification

### 8.1 Test URLs

After deployment succeeds:

1. **Main Site:** `https://your-app.railway.app`
2. **Admin Panel:** `https://your-app.railway.app/admin.php`
3. **Owner Dashboard:** `https://your-app.railway.app/owner.php`
4. **API:** `https://your-app.railway.app/api/restaurants.php`

### 8.2 Check Logs for Errors

```bash
railway logs
```

### 8.3 Test Database Connection

Visit: `https://your-app.railway.app` and verify data displays correctly.

## Troubleshooting

### Database Connection Failing

**Issue:** `Connection refused` or timeout errors

**Solution:**
1. Verify `DB_HOST`, `DB_USER`, `DB_PASS` in Railway Variables
2. Check MySQL service is running in Railway
3. Verify database name matches (`MYSQL_DATABASE`)
4. Check firewall/network rules

```bash
# Test connection via Railway CLI
railway shell mysql
mysql -h ${MYSQL_HOST} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -e "SELECT 1;"
```

### PHP Version Issues

**Issue:** `PHP 7.x detected, but code requires 8.2+`

**Solution:**
1. In Railway Dashboard, go to **Build**
2. Set **PHP Version** to `8.2` or higher

### Missing Files/Uploads

**Issue:** Uploaded images not persisting

**Solution:**
1. Verify volume is mounted at `/app/images`
2. Check file permissions: `chmod 755 images/`
3. Use absolute paths in PHP code

### Mapbox Not Working

**Issue:** Map not displaying

**Solution:**
1. Verify `MAPBOX_ACCESS_TOKEN` is set in Variables
2. Check token has correct permissions (public)
3. Check browser console for CORS errors
4. Verify token is not revoked in Mapbox dashboard

### Google OAuth Issues

**Issue:** Google login not working

**Solution:**
1. Get your Railway app URL: `https://your-app.railway.app`
2. Go to Google Cloud Console
3. Update OAuth redirect URIs to include Railway URL
4. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
5. Clear browser cookies and try again

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | MySQL hostname (auto from MySQL plugin) |
| `DB_PORT` | Yes | MySQL port (default 3306) |
| `DB_USER` | Yes | MySQL username (auto from MySQL plugin) |
| `DB_PASS` | Yes | MySQL password (auto from MySQL plugin) |
| `DB_NAME` | Yes | Database name (auto from MySQL plugin) |
| `MAPBOX_ACCESS_TOKEN` | Yes | Your Mapbox public token |
| `APP_ENV` | No | `production` or `development` |
| `APP_TIMEZONE` | No | Default: `Asia/Manila` |
| `GOOGLE_CLIENT_ID` | Optional | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | For Google OAuth |

## Advanced Configuration

### Custom Domain

1. Go to Railway Project → Settings
2. Click **"Custom Domain"**
3. Enter your domain (e.g., `foodcrawl.estancia.gov.ph`)
4. Update DNS records as instructed
5. Update `GOOGLE_OAUTH_REDIRECT_URI` to use new domain

### Scaling & Performance

For high traffic:

1. Increase Railway plan tier
2. Enable caching headers (already in `.htaccess`)
3. Implement database query optimization
4. Use CDN for static assets (CSS, JS, images)

### SSL/TLS

Railway automatically provides SSL certificates. Your app is secure by default at `https://your-app.railway.app`

## Disaster Recovery

### Backup Database

```bash
# Export database to local file
railway shell mysql
mysqldump -h ${MYSQL_HOST} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} > backup.sql
```

### Restore Database

```bash
# Re-import from backup
railway shell mysql
mysql -h ${MYSQL_HOST} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} < backup.sql
```

## Additional Resources

- Railway Docs: https://docs.railway.app
- Railway CLI: https://docs.railway.app/cli/cli-introduction
- PHP on Railway: https://docs.railway.app/guides/php
- MySQL on Railway: https://docs.railway.app/databases/mysql

## Support

For issues:
1. Check Railway status: https://railway.app/status
2. Review application logs in Railway Dashboard
3. Post in Railway Discord community
4. Check GitHub Issues in this repository

---

**Last Updated:** May 2026
**Application:** Estancia Food Crawl v1.0
