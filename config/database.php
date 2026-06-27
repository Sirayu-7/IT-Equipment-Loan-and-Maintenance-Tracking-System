<?php
/**
 * Database Configuration
 * 
 * Switch between XAMPP (MySQL) and Supabase (PostgreSQL)
 * 
 * Usage:
 *   DB_TYPE=mysql  -> uses local XAMPP MySQL (PRIMARY database for operations)
 *   DB_TYPE=pgsql  -> uses Supabase PostgreSQL (for sync/backup)
 */

// ==========================================
// SELECT DATABASE TYPE
// ==========================================
// Change this to 'pgsql' to use Supabase PostgreSQL
// Change this to 'mysql' to use local XAMPP MySQL
define('DB_TYPE', 'mysql'); // 'mysql' or 'pgsql'

// ==========================================
// MySQL (XAMPP) Configuration
// ==========================================
define('MYSQL_HOST', '127.0.0.1');
define('MYSQL_DB', 'atc_it_asset_db');
define('MYSQL_USER', 'root');
define('MYSQL_PASS', ''); // Default XAMPP password
define('MYSQL_CHARSET', 'utf8mb4');

// ==========================================
// PostgreSQL (Supabase) Configuration
// ==========================================
// Connection string format:
// postgresql://user:password@host:port/database?sslmode=require
define('PGSQL_CONNECTION_STRING', 'postgresql://postgres:8a8w4%40%2444jD20f2@db.lxiewptlfqnacfwdsomh.supabase.co:5432/postgres'); // Password URL-encoded
// OR individual fields:
define('PGSQL_HOST', 'db.lxiewptlfqnacfwdsomh.supabase.co');
define('PGSQL_PORT', '5432');
define('PGSQL_DB', 'postgres');
define('PGSQL_USER', 'postgres');
define('PGSQL_PASS', '8a8w4@$44jD20f2');

// ==========================================
// Derived Configuration
// ==========================================
if (DB_TYPE === 'mysql') {
    $dsn = "mysql:host=" . MYSQL_HOST . ";dbname=" . MYSQL_DB . ";charset=" . MYSQL_CHARSET;
} else {
    // Try connection string first, fallback to individual fields
    if (!empty(PGSQL_CONNECTION_STRING)) {
        $dsn = PGSQL_CONNECTION_STRING;
    } else {
        $dsn = "pgsql:host=" . PGSQL_HOST . ";port=" . PGSQL_PORT . ";dbname=" . PGSQL_DB;
    }
}