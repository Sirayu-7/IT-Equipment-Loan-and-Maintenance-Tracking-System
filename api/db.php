<?php
// api/db.php - Unified Database Connection
// Supports both XAMPP (MySQL) and Supabase (PostgreSQL)

require_once __DIR__ . '/../lib/Database.php';

// Get the database instance
$db = Database::getInstance();

// For backward compatibility with existing code that uses $pdo directly
$pdo = $db->getConnection();

// =============================================
// Schema Migration / Maintenance
// =============================================
if ($db->isMysql()) {
    // MySQL-specific migrations (backward compatibility)
    try {
        $col = $pdo->query("SHOW COLUMNS FROM tb_transactions LIKE 'return_date'")->fetch();
        if (!$col) {
            $pdo->exec("ALTER TABLE tb_transactions ADD COLUMN return_date datetime DEFAULT NULL AFTER borrow_date");
        }
        $pdo->exec("
            UPDATE tb_transactions
            SET return_date = borrow_date
            WHERE trans_status = 'returned'
              AND return_date IS NULL
        ");

        $col = $pdo->query("SHOW COLUMNS FROM tb_repairs LIKE 'report_date'")->fetch();
        if (!$col) {
            $pdo->exec("ALTER TABLE tb_repairs ADD COLUMN report_date datetime DEFAULT current_timestamp() AFTER repair_status");
        }
    } catch (\PDOException $e) {
        // Ignore migration errors for non-existent tables
    }
} else {
    // PostgreSQL (Supabase) migration checks
    try {
        // Check if return_date column exists in tb_transactions
        $stmt = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tb_transactions' AND column_name = 'return_date'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE tb_transactions ADD COLUMN return_date TIMESTAMP DEFAULT NULL");
        }
        
        // Fix null return_date for returned items
        $pdo->exec("
            UPDATE tb_transactions
            SET return_date = borrow_date
            WHERE trans_status = 'returned'
              AND return_date IS NULL
        ");
        
        // Check if report_date column exists in tb_repairs
        $stmt = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tb_repairs' AND column_name = 'report_date'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE tb_repairs ADD COLUMN report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        }
    } catch (\PDOException $e) {
        // Ignore migration errors for non-existent tables
    }
}