# Railway Deployment - Quick Reference Guide

## 📋 Overview

Your Estancia Food Crawl application is now ready for deployment to Railway! This document provides a quick reference for all deployment files and setup steps.

## 🚀 Quick Start (5 minutes)

```bash
# 1. Ensure you're logged into Railway
railway login

# 2. Initialize Railway project
railway init

# 3. Add MySQL database
railway add

# 4. Deploy
git push railway main

# 5. Watch deployment
railway logs --follow
```

## 📁 Deployment Files Created

| File | Purpose |
|------|---------|
| **composer.json** | PHP dependencies declaration for Railway |
| **Procfile** | Process configuration for Railway web server |
| **railway.json** | Railway project configuration (optional) |
| **.nixpacks.toml** | Build system configuration |
| **includes/config_railway.php** | Enhanced database config with Railway support |
| **.env.railway** | Railway environment variables template |
| **RAILWAY_DEPLOYMENT.md** | Comprehensive deployment guide (70+ sections) |
| **RAILWAY_CHECKLIST.md** | Pre/post-deployment verification checklist |
| **railway_migrate.php** | Database migration automation script |
| **railway-deploy.sh** | Linux/Mac quick-start script |
| **railway-deploy.bat** | Windows quick-start script |

## 🔧 Critical Environment Variables

These MUST be set in Railway Variables before deployment:

### Auto-Populated by Railway MySQL Service:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

### Manual Configuration Required:
```
MAPBOX_ACCESS_TOKEN=your_token_from_mapbox.com
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Asia/Manila
```

### Optional (if using Google OAuth):
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🗂️ Project Structure

```
foodcrawl1/
├── api/                          # API endpoints
│   ├── restaurants.php          # Main API
│   ├── chat_history.php         # Chat endpoint
│   └── admin_reports.php        # Admin reports API
├── css/                         # Stylesheets
├── js/                          # JavaScript files
├── images/                      # User uploads (persistent volume)
│   ├── attachments/
│   └── restaurants/
├── includes/
│   ├── config.php              # Main configuration
│   ├── config_railway.php      # Railway-specific config
│   ├── functions.php           # Helper functions
│   └── auth.php                # Authentication
├── sql/                        # Database schemas
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── composer.json              # PHP dependencies
├── Procfile                   # Railway process config
├── railway.json               # Railway settings
├── RAILWAY_DEPLOYMENT.md      # Full deployment guide
├── RAILWAY_CHECKLIST.md       # Verification checklist
├── railway_migrate.php        # Migration script
└── railway-deploy.bat/sh      # Quick-start scripts
```

## 🗄️ Database Setup

### Option 1: Web Interface (Easiest)
1. Open MySQL service in Railway Dashboard
2. Click "Data" tab
3. Upload `food_crawl.sql`

### Option 2: Command Line
```bash
# Connect to Railway MySQL via CLI
railway shell mysql

# Run migration
mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < food_crawl.sql
```

### Option 3: Via App
After deployment:
```bash
railway exec php railway_migrate.php
```

## 🔑 Getting Your API Keys

### Mapbox Token
1. Go to https://account.mapbox.com/tokens/
2. Click "Create a token"
3. Name it "FoodCrawl Production"
4. Enable "public scope"
5. Copy token → Set as `MAPBOX_ACCESS_TOKEN` in Railway

### Google OAuth (Optional)
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://your-app.railway.app`
6. Copy Client ID and Secret → Set in Railway Variables

## 🧪 Testing Checklist

After deployment, verify:

- [ ] Site loads: `https://your-app.railway.app`
- [ ] Map displays restaurants
- [ ] Admin login: `/admin.php`
- [ ] Owner login: `/owner.php`
- [ ] API works: `/api/restaurants.php`
- [ ] Image upload works
- [ ] Search functionality works
- [ ] Ratings/reviews display correctly

## 📊 Monitoring & Logs

```bash
# View real-time logs
railway logs --follow

# View logs from last 1 hour
railway logs -t 1h

# Search logs for errors
railway logs | grep ERROR

# View specific service logs
railway logs --service web
railway logs --service mysql
```

## 🆘 Troubleshooting

### Database Connection Failed
```bash
# Verify variables
railway variables
railway logs

# Test connection
railway shell mysql
mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -e "SELECT 1;"
```

### Map Not Displaying
- Check MAPBOX_ACCESS_TOKEN is set
- Verify token in https://account.mapbox.com/tokens/
- Check browser console for CORS errors

### Images Not Persisting
- Ensure `/images/` volume is mounted (1GB recommended)
- Check permissions: `chmod 755 images/`

### PHP Errors
```bash
# Check PHP version
railway shell web
php -v

# Check PHP extensions
php -m
```

## 📈 Performance Tips

1. **Enable Caching**: `.htaccess` already configured for:
   - Gzip compression
   - Browser caching (1 year for static assets)
   - CDN-friendly headers

2. **Database Optimization**:
   - Add indexes on frequently queried columns
   - Archive old chat history periodically

3. **Image Optimization**:
   - Use WEBP format when possible
   - Implement image resizing for thumbnails

4. **Scaling**:
   - Upgrade Railway plan for more CPU/memory
   - Use separate MySQL plan for large datasets

## 🔒 Security Checklist

- [ ] Never commit `.env` to Git
- [ ] Enable HTTPS (automatic on Railway)
- [ ] Set `APP_DEBUG=false` in production
- [ ] Regularly update dependencies: `composer update`
- [ ] Use strong database passwords
- [ ] Implement rate limiting for APIs (optional)
- [ ] Regular database backups

## 💾 Backup Strategy

### Automated Backups
Railway Pro plan includes automatic backups.

### Manual Backup
```bash
# Export database
railway exec mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > backup.sql

# Export file uploads
railway exec tar -czf uploads.tar.gz images/
```

## 🔄 Deployment Workflow

```
Local Development
      ↓
Commit to Git
      ↓
Push to GitHub
      ↓
Railway Auto-Deploy (on new commits)
      ↓
Run Migrations
      ↓
Test on Railway URL
      ↓
Custom Domain Setup (optional)
```

## 📱 Custom Domain Setup

1. Buy domain (Namecheap, GoDaddy, etc.)
2. Go to Railway Project → Settings → Custom Domain
3. Enter domain and note DNS records
4. Update DNS provider with Railway records
5. Wait 24 hours for propagation
6. Update OAuth redirect URIs in Google Console

## 📚 Additional Resources

| Resource | Link |
|----------|------|
| Railway Documentation | https://docs.railway.app |
| Railway CLI Guide | https://docs.railway.app/cli/cli-introduction |
| PHP on Railway | https://docs.railway.app/guides/php |
| Mapbox Documentation | https://docs.mapbox.com |
| Google OAuth Setup | https://developers.google.com/identity/protocols/oauth2 |

## 🐛 Debug Mode

To enable debug mode temporarily (NOT RECOMMENDED for production):

```bash
# Set in Railway Variables
APP_DEBUG=true

# View detailed error logs
railway logs -f

# Remember to disable after debugging!
railway variables set APP_DEBUG=false
```

## 🎯 Next Steps

1. **Immediate**: Read [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed setup
2. **Before Deploy**: Complete [RAILWAY_CHECKLIST.md](RAILWAY_CHECKLIST.md)
3. **After Deploy**: Run `railway_migrate.php` to initialize database
4. **Ongoing**: Monitor logs and test functionality regularly

## ❓ FAQ

**Q: Do I need to change my code?**
A: Minimal changes. The app already uses environment variables via the existing config system.

**Q: What if I already have customer data?**
A: Export from local database (`mysqldump`) and import to Railway MySQL before launch.

**Q: Can I use my own domain?**
A: Yes! See "Custom Domain Setup" section above.

**Q: How much does Railway cost?**
A: Free tier available. Paid plans start at $5/month. See https://railway.app/pricing

**Q: Can I roll back a deployment?**
A: Yes! Railway keeps deployment history. Roll back from Dashboard → Deployments.

**Q: How do I increase database size?**
A: Upgrade Railway MySQL plan in Dashboard → Plugins → MySQL → Plan

---

## 📞 Support

- **Railway Issues**: https://docs.railway.app or Discord community
- **App Issues**: Check logs with `railway logs -f`
- **Database Issues**: Connect via `railway shell mysql`

---

**Last Updated**: May 2026  
**Version**: 1.0  
**Platform**: Railway  
**Application**: Estancia Food Crawl
