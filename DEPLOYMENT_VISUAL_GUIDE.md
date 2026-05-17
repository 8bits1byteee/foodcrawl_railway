# Railway Deployment - Visual Guide & Flow

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL MACHINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your Code Repository                                           │
│  ├── PHP Files (index.php, admin.php, api/*)                  │
│  ├── Database Schema (food_crawl.sql)                         │
│  ├── Configuration Files (config.php)                         │
│  └── NEW: Railway Configs (Procfile, composer.json, etc.)     │
│                                                                 │
│  Git (Version Control)                                          │
│  └── Staged & Committed                                         │
│                                                                 │
└─────────────┬───────────────────────────────────────────────────┘
              │
              │ git push
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                            │
│                   (Connected to Railway)                         │
└─────────────┬───────────────────────────────────────────────────┘
              │
              │ Auto-Deploy Webhook
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RAILWAY PLATFORM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Build Process:                                                 │
│  ├── Detect PHP 8.2 (from Procfile)                           │
│  ├── Install Dependencies (composer.json)                      │
│  └── Build Docker Image (using nixpacks)                       │
│                                                                 │
│  Services:                                                      │
│  ├── Web Container (your app)                                 │
│  │   ├── Listens on :8080                                     │
│  │   ├── Runs Apache2 + PHP 8.2                               │
│  │   └── Mounts /images/ volume                               │
│  │                                                             │
│  └── MySQL Service                                             │
│      ├── Provides: MYSQL_HOST, MYSQL_PORT, etc.              │
│      ├── Stores: Database files                               │
│      └── Initialized with: food_crawl.sql                     │
│                                                                 │
│  Environment Variables (Railway Dashboard):                     │
│  ├── DB_HOST=${MYSQL_HOST}                                    │
│  ├── DB_USER=${MYSQL_USER}                                    │
│  ├── MAPBOX_ACCESS_TOKEN=[your token]                         │
│  └── APP_ENV=production                                        │
│                                                                 │
└─────────────┬───────────────────────────────────────────────────┘
              │
              │ HTTPS
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PUBLIC INTERNET (Your Users)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  https://your-app.railway.app                                  │
│  ├── Web Browser                                               │
│  ├── Mobile App                                                │
│  └── API Clients                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Deployment Workflow Timeline

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 1. Prepare Code (5 min)                     │
│    ✓ Commit all changes                     │
│    ✓ Ensure .gitignore up to date          │
│    ✓ Push to GitHub main branch             │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 2. Create Railway Project (2 min)           │
│    ✓ Sign up at railway.app                 │
│    ✓ Connect GitHub account                 │
│    ✓ Select foodcrawl1 repository           │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 3. Add MySQL Service (2 min)                │
│    ✓ Click "+ New" → "MySQL"               │
│    ✓ Railway auto-creates database          │
│    ✓ Provides connection variables          │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 4. Set Variables (5 min)                    │
│    ✓ MAPBOX_ACCESS_TOKEN                    │
│    ✓ GOOGLE_CLIENT_ID (optional)            │
│    ✓ GOOGLE_CLIENT_SECRET (optional)        │
│    ✓ Other app settings                     │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 5. Deploy (2-5 min)                         │
│    ✓ git push railway main                  │
│    ✓ Railway detects & deploys              │
│    ✓ Watch build logs in Dashboard          │
│    ✓ App goes live when ready               │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 6. Initialize Database (2 min)              │
│    ✓ railway exec php railway_migrate.php   │
│    ✓ Imports food_crawl.sql                 │
│    ✓ Creates all tables                     │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 7. Test Deployment (5 min)                  │
│    ✓ Visit https://your-app.railway.app    │
│    ✓ Check map displays                    │
│    ✓ Test login                            │
│    ✓ Verify API endpoints                  │
└────┬────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────┐
│ ✅ LIVE IN PRODUCTION! (Total: ~20 min)     │
└──────────────────────────────────────────────┘
```

## 🗂️ File Organization

### Before You Start:
```
📁 foodcrawl1/
├── 📄 index.php                      ← Entry point
├── 📄 admin.php                      ← Admin dashboard
├── 📄 owner.php                      ← Owner dashboard
├── 📄 login.php                      ← Login page
├── 📁 api/
│   ├── 📄 restaurants.php
│   ├── 📄 chat_history.php
│   └── 📄 admin_reports.php
├── 📁 includes/
│   ├── 📄 config.php                 ← Current config
│   └── 📄 functions.php
├── 📁 css/
├── 📁 js/
├── 📁 images/                        ← Uploads folder
└── 📄 food_crawl.sql                 ← Database schema
```

### After Deployment Setup:
```
📁 foodcrawl1/
├── ... (all above files) ...
│
├── 📄 composer.json                  ✨ NEW
├── 📄 Procfile                       ✨ NEW
├── 📄 railway.json                   ✨ NEW
├── 📄 .env.railway                   ✨ NEW
├── 📄 .nixpacks.toml                 ✨ NEW
│
├── 📁 includes/
│   ├── 📄 config.php
│   ├── 📄 config_railway.php         ✨ NEW (enhanced)
│   └── ...
│
├── 📄 railway_migrate.php            ✨ NEW (migration)
├── 📄 railway-deploy.sh              ✨ NEW
├── 📄 railway-deploy.bat             ✨ NEW
│
├── 📁 .docker/                       ✨ NEW
│   └── 📄 apache.conf
│
├── 📄 Dockerfile                     ✨ NEW (Docker)
├── 📄 docker-compose.yml             ✨ NEW (Docker)
│
├── 📄 RAILWAY_DEPLOYMENT.md          ✨ NEW 📖
├── 📄 RAILWAY_QUICK_REFERENCE.md     ✨ NEW 📖
├── 📄 RAILWAY_CHECKLIST.md           ✨ NEW 📖
├── 📄 DEPLOYMENT_SUMMARY.md          ✨ NEW 📖
│
└── 📄 .gitignore                     ✏️ UPDATED
```

## 🔌 Database Connection Flow

```
┌─────────────────────────────────────────────────────────┐
│ Web Request comes in                                    │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ PHP Code (index.php, api/restaurants.php, etc.)        │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ requires includes/config.php                           │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ config.php reads .env file                             │
│ ├── Loads DB_HOST from .env                           │
│ ├── Loads DB_USER from .env                           │
│ ├── Loads DB_PASS from .env                           │
│ └── Loads DB_NAME from .env                           │
└────┬────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│ Creates PDO connection                                 │
│ dsn = "mysql:host=MYSQL_HOST;dbname=MYSQL_DATABASE"  │
└────┬────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│ Railway MySQL Service                                  │
│ (Runs in separate container)                          │
└────┬────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│ Query executes on database                            │
│ Tables: admin_users, owners, restaurants, ratings...  │
└─────────────────────────────────────────────────────────┘
```

## 📊 Environment Variables Mapping

```
┌──────────────────────────────────────────────────────────┐
│ Railway MySQL Plugin provides:                           │
├──────────────────────────────────────────────────────────┤
│ MYSQL_HOST        → Your MySQL hostname                │
│ MYSQL_PORT        → Default 3306                        │
│ MYSQL_USER        → Your database user                 │
│ MYSQL_PASSWORD    → Your database password             │
│ MYSQL_DATABASE    → Your database name                 │
│ DATABASE_URL      → Full connection string             │
└──────────────────────────────────────────────────────────┘
         │
         │ Your .env file maps these to:
         ▼
┌──────────────────────────────────────────────────────────┐
│ Your Application uses:                                  │
├──────────────────────────────────────────────────────────┤
│ DB_HOST      = ${MYSQL_HOST}                           │
│ DB_PORT      = ${MYSQL_PORT}                           │
│ DB_USER      = ${MYSQL_USER}                           │
│ DB_PASS      = ${MYSQL_PASSWORD}                       │
│ DB_NAME      = ${MYSQL_DATABASE}                       │
└──────────────────────────────────────────────────────────┘
         │
         │ config.php defines constants:
         ▼
┌──────────────────────────────────────────────────────────┐
│ In your PHP code:                                       │
├──────────────────────────────────────────────────────────┤
│ define('DB_HOST', getenv('DB_HOST'))                   │
│ define('DB_USER', getenv('DB_USER'))                   │
│ define('DB_PASS', getenv('DB_PASS'))                   │
│ define('DB_NAME', getenv('DB_NAME'))                   │
│                                                        │
│ PDO: new PDO("mysql:host=$host;dbname=$db", $u, $p)  │
└──────────────────────────────────────────────────────────┘
```

## 🚦 Deployment Status Monitoring

```
Deployment Progress:
═════════════════════════════════════════════════════════

[████████░░░░░░░░░░░░░░░░░░░░░░░░] Build: In Progress
                                    
[██████████████████████████████████] Build: Complete ✓

[██████████░░░░░░░░░░░░░░░░░░░░░░░░] Deploy: In Progress
                                    
[██████████████████████████████████] Deploy: Complete ✓

[██████████████████████████████████] Health Check: OK ✓

═════════════════════════════════════════════════════════
Status: 🟢 LIVE - https://your-app.railway.app
═════════════════════════════════════════════════════════
```

## 📋 Post-Deployment Verification

```
Testing Checklist:

┌─ HOME PAGE ──────────────────────────────┐
│ [ ] Page loads without errors           │
│ [ ] Map displays restaurants            │
│ [ ] Images load from /images/           │
│ [ ] Mapbox attribution visible          │
└──────────────────────────────────────────┘

┌─ AUTHENTICATION ─────────────────────────┐
│ [ ] Admin login works (/admin.php)      │
│ [ ] Owner login works (/owner.php)      │
│ [ ] User login works (/login.php)       │
│ [ ] Sessions persist                    │
└──────────────────────────────────────────┘

┌─ FUNCTIONALITY ──────────────────────────┐
│ [ ] Search works                         │
│ [ ] Filters work                         │
│ [ ] Ratings display                     │
│ [ ] Reviews show                        │
│ [ ] Add review works                    │
│ [ ] Image upload works                  │
│ [ ] Chat functional (if enabled)        │
└──────────────────────────────────────────┘

┌─ API ENDPOINTS ──────────────────────────┐
│ [ ] /api/restaurants.php responds       │
│ [ ] JSON format correct                 │
│ [ ] Data complete                       │
└──────────────────────────────────────────┘

┌─ DATABASE ───────────────────────────────┐
│ [ ] Tables created                      │
│ [ ] Data persists after refresh         │
│ [ ] New data saves to DB                │
└──────────────────────────────────────────┘
```

## 🔐 Security Flow

```
User Request
    │
    ▼
HTTPS/TLS (Automatic ✓)
    │
    ▼
Railway WAF (Optional, Pro plan)
    │
    ▼
PHP-FPM Container
    │
    ├─ Validate input
    ├─ Check authentication
    ├─ Prepare SQL query
    │
    ▼
PDO (Prepared Statements)
    │
    ├─ SQL Injection Protection ✓
    ├─ Parameter Binding ✓
    │
    ▼
MySQL Container
    │
    └─ Data returned
```

## 🎯 Success Path

```
START
  │
  ├─→ [Create Railway Account]
  │        │
  │        └─→ [Connect GitHub]
  │                │
  │                └─→ [Select Repository]
  │                        │
  │                        └─→ [Add MySQL Service]
  │                                │
  │                                └─→ [Set Variables]
  │                                        │
  │                                        └─→ [Deploy]
  │                                                │
  │                                                └─→ [Run Migrations]
  │                                                        │
  │                                                        └─→ [Test]
  │
  └─→ ✅ LIVE IN PRODUCTION

```

---

**Start Here:** Read [RAILWAY_QUICK_REFERENCE.md](RAILWAY_QUICK_REFERENCE.md) next! 📖
