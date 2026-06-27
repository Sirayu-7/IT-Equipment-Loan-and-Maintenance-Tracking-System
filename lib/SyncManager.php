<?php
/**
 * SyncManager - Synchronize data between XAMPP (MySQL) and Supabase (PostgreSQL)
 * 
 * This class handles unidirectional synchronization from MySQL to PostgreSQL:
 *   tb_users, tb_assets, tb_transactions, tb_repairs
 * 
 * Usage:
 *   $sync = SyncManager::getInstance();
 *   $result = $sync->syncAll(); // Sync all data from MySQL to PostgreSQL
 *   $result = $sync->syncTable('tb_users'); // Sync a specific table
 *   $result = $sync->verifySync(); // Check if data matches
 */

require_once __DIR__ . '/Database.php';

class SyncManager {
    private static $instance = null;
    private $mysqlDb;
    private $pgsqlDb;
    private $results = [];
    
    private function __construct() {
        // MySQL connection (XAMPP)
        $this->mysqlDb = new PDO(
            "mysql:host=" . MYSQL_HOST . ";dbname=" . MYSQL_DB . ";charset=" . MYSQL_CHARSET,
            MYSQL_USER,
            MYSQL_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
        
        // PostgreSQL connection (Supabase)
        $pgsqlDsn = "pgsql:host=" . PGSQL_HOST . ";port=" . PGSQL_PORT . ";dbname=" . PGSQL_DB;
        $this->pgsqlDb = new PDO(
            $pgsqlDsn,
            PGSQL_USER,
            PGSQL_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getResults() {
        return $this->results;
    }
    
    public function getMysqlConnection() {
        return $this->mysqlDb;
    }
    
    public function getPgsqlConnection() {
        return $this->pgsqlDb;
    }
    
    /**
     * Test both database connections
     */
    public function testConnections() {
        $status = [];
        
        try {
            $this->mysqlDb->query("SELECT 1");
            $status['mysql'] = [
                'connected' => true,
                'message'   => 'MySQL (XAMPP) connection OK',
                'host'      => MYSQL_HOST,
                'database'  => MYSQL_DB,
            ];
        } catch (\PDOException $e) {
            $status['mysql'] = [
                'connected' => false,
                'message'   => 'MySQL (XAMPP) FAILED: ' . $e->getMessage(),
            ];
        }
        
        try {
            $this->pgsqlDb->query("SELECT 1");
            $status['pgsql'] = [
                'connected' => true,
                'message'   => 'PostgreSQL (Supabase) connection OK',
                'host'      => PGSQL_HOST,
                'database'  => PGSQL_DB,
            ];
        } catch (\PDOException $e) {
            $status['pgsql'] = [
                'connected' => false,
                'message'   => 'PostgreSQL (Supabase) FAILED: ' . $e->getMessage(),
            ];
        }
        
        return $status;
    }
    
    /**
     * Ensure Supabase tables exist (create if not)
     */
    public function ensureSupabaseTables() {
        $results = [];
        $pgsql = $this->pgsqlDb;
        
        $createStatements = [
            "CREATE TABLE IF NOT EXISTS tb_users (
                user_id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL DEFAULT '123',
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user'))
            )",
            "CREATE TABLE IF NOT EXISTS tb_assets (
                asset_id SERIAL PRIMARY KEY,
                asset_code VARCHAR(100) NOT NULL UNIQUE,
                asset_name VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'repairing'))
            )",
            "CREATE TABLE IF NOT EXISTS tb_transactions (
                trans_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES tb_users(user_id) ON DELETE CASCADE,
                asset_id INTEGER NOT NULL REFERENCES tb_assets(asset_id) ON DELETE CASCADE,
                borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                return_date TIMESTAMP DEFAULT NULL,
                detail TEXT,
                trans_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (trans_status IN ('pending', 'approved', 'returned'))
            )",
            "CREATE TABLE IF NOT EXISTS tb_repairs (
                repair_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES tb_users(user_id) ON DELETE CASCADE,
                asset_id INTEGER NOT NULL REFERENCES tb_assets(asset_id) ON DELETE CASCADE,
                detail TEXT,
                repair_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (repair_status IN ('pending', 'fixed')),
                report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
        ];
        
        foreach ($createStatements as $sql) {
            try {
                $pgsql->exec($sql);
            } catch (\PDOException $e) {
                if (stripos($e->getMessage(), 'already exists') === false) {
                    $results[] = "Warning: " . $e->getMessage();
                }
            }
        }
        
        return $results;
    }
    
    /**
     * Clear all Supabase tables and reset sequences
     */
    public function clearSupabaseTables() {
        $pgsql = $this->pgsqlDb;
        try {
            $pgsql->exec("TRUNCATE TABLE tb_repairs, tb_transactions, tb_assets, tb_users RESTART IDENTITY CASCADE");
            return true;
        } catch (\PDOException $e) {
            try {
                $pgsql->exec("DELETE FROM tb_repairs");
                $pgsql->exec("DELETE FROM tb_transactions");
                $pgsql->exec("DELETE FROM tb_assets");
                $pgsql->exec("DELETE FROM tb_users");
                $pgsql->exec("ALTER SEQUENCE IF EXISTS tb_users_user_id_seq RESTART WITH 1");
                $pgsql->exec("ALTER SEQUENCE IF EXISTS tb_assets_asset_id_seq RESTART WITH 1");
                $pgsql->exec("ALTER SEQUENCE IF EXISTS tb_transactions_trans_id_seq RESTART WITH 1");
                $pgsql->exec("ALTER SEQUENCE IF EXISTS tb_repairs_repair_id_seq RESTART WITH 1");
                return true;
            } catch (\PDOException $e2) {
                return false;
            }
        }
    }
    
    /**
     * UPSERT a row into PostgreSQL (INSERT ... ON CONFLICT DO UPDATE)
     */
    private function upsertPgsqlRow($tableName, $config, $mysqlRow, $pgsql) {
        $columns = $config['columns'];
        $pk = $config['primaryKey'];
        
        // Build column list and parameter placeholders
        $colList = implode(', ', $columns);
        $paramList = ':' . implode(', :', $columns);
        
        // Build exclusion list for ON CONFLICT (all non-PK columns)
        $updates = [];
        foreach ($columns as $col) {
            if ($col !== $pk) {
                $updates[] = "$col = EXCLUDED.$col";
            }
        }
        $updateStr = implode(', ', $updates);
        
        $sql = "INSERT INTO " . $tableName . " (" . $colList . ") VALUES (" . $paramList . ")
                ON CONFLICT (" . $pk . ") DO UPDATE SET " . $updateStr;
        
        $stmt = $pgsql->prepare($sql);
        
        foreach ($columns as $col) {
            $value = isset($mysqlRow[$col]) ? $mysqlRow[$col] : null;
            $stmt->bindValue(':' . $col, $value);
        }
        
        $stmt->execute();
        return true;
    }
    
    /**
     * Sync a specific table from MySQL to PostgreSQL
     */
    public function syncTable($tableName) {
        $result = [
            'table'      => $tableName,
            'mysql_rows' => 0,
            'pgsql_rows' => 0,
            'inserted'   => 0,
            'errors'     => [],
            'status'     => 'success',
        ];
        
        $pgsql = $this->pgsqlDb;
        
        try {
            $tableConfig = $this->getTableConfig($tableName);
            if (!$tableConfig) {
                $result['status'] = 'error';
                $result['errors'][] = "Unknown table: " . $tableName;
                return $result;
            }
            
            // Fetch data from MySQL
            $mysqlRows = $this->fetchMysqlTable($tableName, $tableConfig['primaryKey']);
            $result['mysql_rows'] = count($mysqlRows);
            
            if (empty($mysqlRows)) {
                $result['status'] = 'empty';
                return $result;
            }
            
            // Do NOT use transaction - process each row individually
            // so FK violations don't kill the entire batch
            foreach ($mysqlRows as $mysqlRow) {
                try {
                    $this->upsertPgsqlRow($tableName, $tableConfig, $mysqlRow, $pgsql);
                    $result['inserted']++;
                } catch (\PDOException $e) {
                    $msg = $e->getMessage();
                    // Check if it's a FK violation - just skip those rows gracefully
                    if (strpos($msg, 'foreign key') !== false || strpos($msg, 'violates foreign') !== false) {
                        // Silently skip FK violations (orphaned references)
                        continue;
                    }
                    $result['errors'][] = $msg;
                }
            }
            
        } catch (\PDOException $e) {
            if ($pgsql->inTransaction()) {
                $pgsql->rollBack();
            }
            $result['status'] = 'error';
            $result['errors'][] = $e->getMessage();
        }
        
        $this->results[$tableName] = $result;
        return $result;
    }
    
    /**
     * Sync all tables from MySQL to PostgreSQL
     * Clears existing data first, then re-inserts in FK order
     */
    public function syncAll() {
        // Ensure tables exist first
        $this->ensureSupabaseTables();
        
        // Clear existing data
        $this->clearSupabaseTables();
        
        // Sync in order (respecting foreign key constraints)
        $results = [];
        $results['tb_users'] = $this->syncTable('tb_users');
        $results['tb_assets'] = $this->syncTable('tb_assets');
        $results['tb_transactions'] = $this->syncTable('tb_transactions');
        $results['tb_repairs'] = $this->syncTable('tb_repairs');
        
        return $results;
    }
    
    /**
     * Verify data consistency between MySQL and PostgreSQL
     */
    public function verifySync() {
        $tables = ['tb_users', 'tb_assets', 'tb_transactions', 'tb_repairs'];
        $verification = [];
        
        foreach ($tables as $table) {
            $tableConfig = $this->getTableConfig($table);
            if (!$tableConfig) continue;
            
            $mysqlRows = $this->fetchMysqlTable($table, $tableConfig['primaryKey']);
            $pgsqlRows = $this->fetchPgsqlTable($table, $tableConfig['primaryKey']);
            
            $verification[$table] = [
                'mysql_count' => count($mysqlRows),
                'pgsql_count' => count($pgsqlRows),
                'match'       => count($mysqlRows) === count($pgsqlRows),
                'difference'  => abs(count($mysqlRows) - count($pgsqlRows)),
            ];
        }
        
        return $verification;
    }
    
    // ==========================================
    // Private helper methods
    // ==========================================
    
    private function fetchMysqlTable($tableName, $orderBy = null) {
        $sql = "SELECT * FROM " . $tableName;
        if ($orderBy) $sql .= " ORDER BY " . $orderBy;
        return $this->mysqlDb->query($sql)->fetchAll();
    }
    
    private function fetchPgsqlTable($tableName, $orderBy = null) {
        $sql = "SELECT * FROM " . $tableName;
        if ($orderBy) $sql .= " ORDER BY " . $orderBy;
        return $this->pgsqlDb->query($sql)->fetchAll();
    }
    
    private function getTableConfig($tableName) {
        $configs = [
            'tb_users' => [
                'primaryKey'  => 'user_id',
                'columns'     => ['user_id', 'username', 'password', 'full_name', 'role'],
                'dateColumns' => [],
            ],
            'tb_assets' => [
                'primaryKey'  => 'asset_id',
                'columns'     => ['asset_id', 'asset_code', 'asset_name', 'description', 'status'],
                'dateColumns' => [],
            ],
            'tb_transactions' => [
                'primaryKey'  => 'trans_id',
                'columns'     => ['trans_id', 'user_id', 'asset_id', 'borrow_date', 'return_date', 'detail', 'trans_status'],
                'dateColumns' => ['borrow_date', 'return_date'],
            ],
            'tb_repairs' => [
                'primaryKey'  => 'repair_id',
                'columns'     => ['repair_id', 'user_id', 'asset_id', 'detail', 'repair_status', 'report_date'],
                'dateColumns' => ['report_date'],
            ],
        ];
        
        return isset($configs[$tableName]) ? $configs[$tableName] : null;
    }
}