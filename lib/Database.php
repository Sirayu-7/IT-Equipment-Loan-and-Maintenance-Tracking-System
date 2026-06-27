<?php
/**
 * Database Abstraction Class
 * 
 * Provides a unified interface for both MySQL (XAMPP) and PostgreSQL (Supabase).
 * Automatically handles SQL dialect differences.
 */
require_once __DIR__ . '/../config/database.php';

class Database {
    private static $instance = null;
    private $pdo;
    private $dbType;
    
    /**
     * Private constructor - singleton pattern
     */
    private function __construct() {
        $this->dbType = DB_TYPE;
        $this->connect();
    }
    
    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get the PDO connection
     */
    public function getConnection() {
        return $this->pdo;
    }
    
    /**
     * Get the database type
     */
    public function getType() {
        return $this->dbType;
    }
    
    /**
     * Check if using PostgreSQL (Supabase)
     */
    public function isPostgres() {
        return $this->dbType === 'pgsql';
    }
    
    /**
     * Check if using MySQL
     */
    public function isMysql() {
        return $this->dbType === 'mysql';
    }
    
    /**
     * Establish database connection
     */
    private function connect() {
        try {
            if ($this->isMysql()) {
                $this->pdo = new PDO($GLOBALS['dsn'], MYSQL_USER, MYSQL_PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } else {
                // PostgreSQL (Supabase)
                $user = PGSQL_USER;
                $pass = PGSQL_PASS;
                
                // If connection string is provided, parse credentials from it
                if (!empty(PGSQL_CONNECTION_STRING)) {
                    $parts = parse_url(PGSQL_CONNECTION_STRING);
                    if (isset($parts['user'])) $user = $parts['user'];
                    if (isset($parts['pass'])) $pass = $parts['pass'];
                }
                
                $this->pdo = new PDO($GLOBALS['dsn'], $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            }
        } catch (\PDOException $e) {
            header('Content-Type: application/json');
            echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
            exit;
        }
    }
    
    /**
     * Execute a query with parameters
     * 
     * @param string $sql SQL query (MySQL-compatible, will be translated for PostgreSQL)
     * @param array $params Query parameters
     * @return \PDOStatement
     */
    public function query($sql, $params = []) {
        $sql = $this->translateSQL($sql);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    /**
     * Fetch all rows
     */
    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll();
    }
    
    /**
     * Fetch a single row
     */
    public function fetch($sql, $params = []) {
        return $this->query($sql, $params)->fetch();
    }
    
    /**
     * Fetch a single column value
     */
    public function fetchColumn($sql, $params = []) {
        return $this->query($sql, $params)->fetchColumn();
    }
    
    /**
     * Execute a statement (INSERT, UPDATE, DELETE)
     */
    public function execute($sql, $params = []) {
        return $this->query($sql, $params)->rowCount();
    }
    
    /**
     * Get the last inserted ID
     */
    public function lastInsertId($sequence = null) {
        if ($this->isPostgres() && $sequence) {
            return $this->pdo->lastInsertId($sequence);
        }
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Begin a transaction
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }
    
    /**
     * Commit a transaction
     */
    public function commit() {
        return $this->pdo->commit();
    }
    
    /**
     * Rollback a transaction
     */
    public function rollBack() {
        return $this->pdo->rollBack();
    }
    
    /**
     * Translate MySQL-specific SQL to PostgreSQL-compatible SQL
     * 
     * @param string $sql MySQL SQL query
     * @return string Translated SQL for the current database type
     */
    public function translateSQL($sql) {
        if ($this->isMysql()) {
            return $sql;
        }
        
        // PostgreSQL SQL translation rules
        $replacements = [
            // Date functions
            '/DATE\(NOW\(\)\) - INTERVAL \d+ DAY/' => function($matches) {
                preg_match('/\d+/', $matches[0], $num);
                return "CURRENT_DATE - INTERVAL '{$num[0]} days'";
            },
            '/DATE\(NOW\(\)\)/' => "CURRENT_DATE",
            '/NOW\(\)/' => "CURRENT_TIMESTAMP",
            '/DATE\((\w+)\)/' => function($matches) {
                return "DATE({$matches[1]})"; // same in postgres for column dates
            },
            
            // MySQL-specific column checks
            '/SHOW COLUMNS FROM (\w+) LIKE \'([^\']+)\'/' => function($matches) {
                $table = $matches[1];
                $column = $matches[2];
                return "SELECT column_name FROM information_schema.columns WHERE table_name = '{$table}' AND column_name = '{$column}'";
            },
            
            // MySQL ALTER TABLE ADD COLUMN with AFTER
            '/ALTER TABLE (\w+) ADD COLUMN (\w+) (.+?) AFTER (\w+)/' => function($matches) {
                return "ALTER TABLE {$matches[1]} ADD COLUMN {$matches[2]} {$matches[3]}";
            },
            
            // MySQL ALTER TABLE ADD COLUMN with default CURRENT_TIMESTAMP
            '/default current_timestamp\(\)/i' => "DEFAULT CURRENT_TIMESTAMP",
            
            // MySQL GROUP BY with column alias in HAVING
            // Keep as-is mostly compatible
            
            // Backtick removal
            '/`(\w+)`/' => '${1}',
        ];
        
        // Apply regex replacements
        foreach ($replacements as $pattern => $replacement) {
            if (is_callable($replacement)) {
                $sql = preg_replace_callback($pattern, $replacement, $sql);
            } else {
                $sql = preg_replace($pattern, $replacement, $sql);
            }
        }
        
        return $sql;
    }
    
    /**
     * Get Supabase-compatible SQL schema
     */
    public static function getSupabaseSchema() {
        return "
-- =============================================
-- Supabase (PostgreSQL) Schema for IT Asset System
-- Execute this in Supabase SQL Editor
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS tb_users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL DEFAULT '123',
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user'))
);

-- Assets (Equipment) table
CREATE TABLE IF NOT EXISTS tb_assets (
    asset_id SERIAL PRIMARY KEY,
    asset_code VARCHAR(100) NOT NULL UNIQUE,
    asset_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'repairing'))
);

-- Transactions (Borrow/Return) table
CREATE TABLE IF NOT EXISTS tb_transactions (
    trans_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tb_users(user_id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES tb_assets(asset_id) ON DELETE CASCADE,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP DEFAULT NULL,
    detail TEXT,
    trans_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (trans_status IN ('pending', 'approved', 'returned'))
);

-- Repairs table
CREATE TABLE IF NOT EXISTS tb_repairs (
    repair_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tb_users(user_id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES tb_assets(asset_id) ON DELETE CASCADE,
    detail TEXT,
    repair_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (repair_status IN ('pending', 'fixed')),
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: 123)
INSERT INTO tb_users (username, password, full_name, role) 
VALUES ('admin', '123', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO tb_users (username, password, full_name, role) 
VALUES ('staff', '123', 'Staff User', 'staff')
ON CONFLICT (username) DO NOTHING;

INSERT INTO tb_users (username, password, full_name, role) 
VALUES ('user', '123', 'Normal User', 'user')
ON CONFLICT (username) DO NOTHING;
";
    }
}