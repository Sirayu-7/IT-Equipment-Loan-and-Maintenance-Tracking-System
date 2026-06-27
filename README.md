# IT-Equipment-Loan-and-Maintenance-Tracking-System

ระบบยืม-คืนและแจ้งซ่อมอุปกรณ์ IT (IT Asset Loan & Repair Tracking System)

## Features
- 📊 Dashboard with charts (7-day borrow/return/repair stats)
- 📦 Equipment (Asset) Management (CRUD)
- 👥 User Management (Admin, Staff, User roles)
- 🔄 Borrow & Return System (request, approve, return)
- 🔧 Repair Request System (report, fix, complete)
- 📋 Report Generation (borrows & repairs, printable)

## Requirements
- PHP 7.4+ with PDO extensions (pdo_mysql for XAMPP, pdo_pgsql for Supabase)
- Web server (Apache via XAMPP, or any PHP-capable server)

## Database Support

This system supports **two database types**:

### Option 1: XAMPP (MySQL) - Local
1. Start Apache and MySQL in XAMPP Control Panel
2. Open `config/database.php` and set: `define('DB_TYPE', 'mysql');`
3. Configure MySQL credentials if different from defaults
4. Run `http://localhost/It-dddd/setup_db.php` in browser to create tables and seed data
5. OR manually import `database/it-asset-system_schema.sql` into phpMyAdmin

### Option 2: Supabase (PostgreSQL) - Cloud
1. Create a Supabase project at https://supabase.com
2. Go to **SQL Editor** in Supabase dashboard
3. Open `database/supabase-schema.sql`, copy all contents, paste into SQL Editor, and click **Run**
4. Open `config/database.php` and configure:
   ```php
   define('DB_TYPE', 'pgsql');
   ```
   Then fill in your Supabase credentials:
   ```php
   define('PGSQL_CONNECTION_STRING', 'postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres');
   ```
   Or fill individual fields:
   ```php
   define('PGSQL_HOST', 'db.xxxxx.supabase.co');
   define('PGSQL_PORT', '5432');
   define('PGSQL_DB', 'postgres');
   define('PGSQL_USER', 'postgres');
   define('PGSQL_PASS', 'YOUR_PASSWORD');
   ```
5. Find your credentials in Supabase: **Project Settings** → **Database** → **Connection string**
6. (Optional) Run `http://localhost/It-dddd/setup_db.php` to verify connection

## Default Login Credentials
| Username | Password | Role  |
|----------|----------|-------|
| admin    | 123      | Admin |
| staff    | 123      | Staff |
| user     | 123      | User  |

## Project Structure
```
├── api/                  # PHP API endpoints
│   ├── db.php            # Database connection (auto-detects MySQL or PostgreSQL)
│   ├── login.php         # Authentication
│   ├── logout.php        # Session destroy
│   ├── dashboard.php     # Dashboard statistics
│   ├── equipment.php     # Equipment CRUD
│   ├── borrow.php        # Borrow/Return management
│   ├── users.php         # User management
│   └── repair.php        # Repair management
├── assets/
│   ├── css/
│   │   └── style.css     # UI styles
│   └── js/
│       ├── auth.js       # Authentication logic
│       ├── ui.js         # UI components (modal, tooltip, popover)
│       ├── dashboard.js   # Dashboard charts
│       ├── equipment.js   # Equipment page
│       ├── users.js       # Users page
│       ├── borrow.js      # Borrow page
│       ├── repair.js      # Repair page
│       └── report.js      # Report generation
├── config/
│   └── database.php      # Database configuration (switch MySQL/PostgreSQL)
├── lib/
│   └── Database.php      # Database abstraction class
├── database/
│   ├── supabase-schema.sql  # PostgreSQL schema for Supabase
│   └── it-asset-system_schema.sql  (MySQL schema - not included)
├── index.html            # Main application
└── setup_db.php          # Database setup script
```

## Sync Manager: XAMPP (MySQL) ↔ Supabase (PostgreSQL)

The system includes a **Sync Manager** that can sync data from your local XAMPP database to Supabase cloud.

### Usage

1. Open **`http://localhost/It-dddd/sync.html`** in your browser
2. Click **"Test Connections"** to verify both databases are reachable
3. Click **"Setup Supabase Tables"** to create tables in Supabase
4. Click **"Sync All to Supabase"** to sync all data

### API Endpoints

| Action | URL |
|--------|-----|
| Test connections | `api/sync.php?action=test` |
| Setup tables | `api/sync.php?action=setup_tables` |
| Sync all data | `api/sync.php?action=sync_all` |
| Verify sync | `api/sync.php?action=verify` |

### Files

- **`lib/SyncManager.php`** - Core sync engine (connects to both MySQL & PostgreSQL)
- **`api/sync.php`** - REST API for sync operations
- **`sync.html`** - Web UI for managing sync

### How it works

1. The system **ALWAYS uses XAMPP (MySQL) as the primary database** for operations
2. Sync Manager copies data from XAMPP → Supabase
3. All tables are synced in order: `tb_users` → `tb_assets` → `tb_transactions` → `tb_repairs`
4. Records with missing foreign key references are gracefully skipped
5. Use the web UI at `sync.html` to sync data anytime

## Architecture: How Dual Database Support Works

- **`config/database.php`** - Sets `DB_TYPE` to `'mysql'` (XAMPP) or `'pgsql'` (Supabase)
- **`lib/Database.php`** - Singleton database class that:
  - Connects to the appropriate database type
  - Translates MySQL SQL to PostgreSQL-compatible SQL when needed
  - Provides methods: `query()`, `fetchAll()`, `fetch()`, `fetchColumn()`, `execute()`
- **`api/db.php`** - Sets up `$pdo` and `$db` variables for all API files
- SQL translation handles: `NOW()` → `CURRENT_TIMESTAMP`, `INTERVAL` → PostgreSQL syntax, `SHOW COLUMNS` → `information_schema`, backtick removal

To switch databases, just change `DB_TYPE` in `config/database.php` and ensure the target database has the schema loaded.
