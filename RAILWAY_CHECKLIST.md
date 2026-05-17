# Railway Deployment Checklist

Use this checklist to ensure your Railway deployment is properly configured.

## Pre-Deployment ✓

- [ ] All code committed to Git and pushed to main branch
- [ ] `.env` file is in `.gitignore` (never commit secrets)
- [ ] `.env.example` file is updated with required variables
- [ ] All SQL migration files are in the project root
- [ ] `composer.json` exists with PHP dependencies
- [ ] `Procfile` is present and correctly configured

## Railway Setup ✓

- [ ] Railway account created and verified
- [ ] GitHub repository connected to Railway
- [ ] MySQL database service added to project
- [ ] PHP runtime version set to 8.2 or higher

## Environment Variables ✓

**Database Variables (auto-populated by MySQL service):**
- [ ] `MYSQL_HOST` is set
- [ ] `MYSQL_PORT` is set (default 3306)
- [ ] `MYSQL_USER` is set
- [ ] `MYSQL_PASSWORD` is set
- [ ] `MYSQL_DATABASE` is set

**Application Variables (manually set):**
- [ ] `MAPBOX_ACCESS_TOKEN` is set
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_TIMEZONE=Asia/Manila`
- [ ] `GOOGLE_CLIENT_ID` is set (if using OAuth)
- [ ] `GOOGLE_CLIENT_SECRET` is set (if using OAuth)

## Database Setup ✓

- [ ] Database schema imported (`food_crawl.sql`)
- [ ] Admin user credentials configured
- [ ] Owner accounts migrated
- [ ] Database connection tested successfully
- [ ] File upload directory permissions set to 755

## File Structure ✓

- [ ] Application root files present (index.php, admin.php, etc.)
- [ ] `/api/` directory with API endpoints
- [ ] `/css/` directory with stylesheets
- [ ] `/js/` directory with JavaScript files
- [ ] `/includes/` directory with config and functions
- [ ] `/images/` directory created for uploads

## Post-Deployment Testing ✓

- [ ] Main site loads without errors: `https://your-app.railway.app`
- [ ] Map displays with Mapbox integration
- [ ] Admin login works: `/admin.php`
- [ ] Owner login works: `/owner.php`
- [ ] API endpoints respond: `/api/restaurants.php`
- [ ] Image uploads work correctly
- [ ] Search functionality works
- [ ] Chat feature functional (if applicable)
- [ ] Google OAuth works (if enabled)
- [ ] Rating/review submission works

## Performance & Security ✓

- [ ] HTTPS enabled (automatic on Railway)
- [ ] Browser caching headers set (in `.htaccess`)
- [ ] Gzip compression enabled
- [ ] Error logging configured
- [ ] Debug mode disabled in production
- [ ] Database credentials not exposed in frontend code
- [ ] API keys stored in environment variables only

## Monitoring ✓

- [ ] Logs accessible via Railway Dashboard or CLI
- [ ] Error tracking configured (optional)
- [ ] Backup strategy in place
- [ ] Database backups scheduled (if available)

## Domain Setup (Optional) ✓

- [ ] Custom domain DNS configured
- [ ] SSL certificate valid
- [ ] Redirect from HTTP to HTTPS working
- [ ] OAuth redirect URIs updated for custom domain

## Common Issues - Resolved ✓

- [ ] Database connection not timing out
- [ ] File permissions correct on `/images/` directory
- [ ] Mapbox token valid and not revoked
- [ ] PHP version compatible (8.1+)
- [ ] No conflicting `config.php` includes

## Maintenance Schedule

- **Weekly:** Check error logs for issues
- **Monthly:** Backup database
- **Quarterly:** Review security and update dependencies
- **As needed:** Update environment variables for new features

---

**Status:** [ ] Ready for Production

**Deployed On:** _______________

**By:** _______________

**Notes:**
```
_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________
```
