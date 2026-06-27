<?php
/**
 * API: Sync Manager - Synchronize XAMPP (MySQL) with Supabase (PostgreSQL)
 * 
 * Endpoints:
 *   GET  api/sync.php?action=test         - Test connections to both databases
 *   GET  api/sync.php?action=verify       - Verify data consistency
 *   POST api/sync.php?action=sync_all     - Sync all tables from MySQL to Supabase
 *   POST api/sync.php?action=sync_table   - Sync a specific table (requires table parameter)
 */

require_once __DIR__ . '/../lib/SyncManager.php';

header('Content-Type: application/json; charset=utf-8');

// Enable error reporting for debugging (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Check if pdo_pgsql extension is available
if (!extension_loaded('pdo_pgsql')) {
    echo json_encode([
        'error'   => true,
        'message' => '❌ pdo_pgsql extension is NOT installed. Please enable it in php.ini to connect to Supabase.',
        'details' => 'Open XAMPP Control Panel -> Apache -> Config -> PHP (php.ini) and uncomment: extension=pdo_pgsql or extension=php_pdo_pgsql.dll',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    $sync = SyncManager::getInstance();
    
    switch ($action) {
        case 'test':
            // Test connections to both databases
            $status = $sync->testConnections();
            echo json_encode([
                'success' => $status['mysql']['connected'] && $status['pgsql']['connected'],
                'message' => 'Connection test completed',
                'data'    => $status,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            break;
            
        case 'verify':
            // Verify data consistency
            $verification = $sync->verifySync();
            $allMatch = true;
            $totalMysql = 0;
            $totalPgsql = 0;
            
            foreach ($verification as $table => $info) {
                if (!$info['match']) {
                    $allMatch = false;
                }
                $totalMysql += $info['mysql_count'];
                $totalPgsql += $info['pgsql_count'];
            }
            
            echo json_encode([
                'success'          => $allMatch,
                'message'          => $allMatch 
                    ? '✅ All tables are in sync!' 
                    : '⚠️ Some tables have differences (MySQL has ' . $totalMysql . ' rows, Supabase has ' . $totalPgsql . ' rows)',
                'data'             => $verification,
                'total_mysql_rows' => $totalMysql,
                'total_pgsql_rows' => $totalPgsql,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            break;
            
        case 'sync_all':
            // Sync all tables from MySQL to Supabase
            $results = $sync->syncAll();
            $totalInserted = 0;
            $totalUpdated = 0;
            $totalErrors = 0;
            $allSuccess = true;
            
            foreach ($results as $table => $result) {
                $totalInserted += $result['inserted'];
                $totalUpdated += $result['updated'];
                if ($result['status'] === 'error') {
                    $totalErrors++;
                    $allSuccess = false;
                }
            }
            
            echo json_encode([
                'success'        => $allSuccess,
                'message'        => "Sync completed: $totalInserted inserted, $totalUpdated updated",
                'data'           => $results,
                'summary'        => [
                    'inserted' => $totalInserted,
                    'updated'  => $totalUpdated,
                    'errors'   => $totalErrors,
                ],
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            break;
            
        case 'sync_table':
            // Sync a specific table
            $table = isset($_POST['table']) ? $_POST['table'] : (isset($_GET['table']) ? $_GET['table'] : '');
            
            $validTables = ['tb_users', 'tb_assets', 'tb_transactions', 'tb_repairs'];
            if (!in_array($table, $validTables)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid table name. Valid tables: ' . implode(', ', $validTables),
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                break;
            }
            
            $result = $sync->syncTable($table);
            echo json_encode([
                'success' => $result['status'] === 'success',
                'message' => "Table '{$table}' sync: {$result['inserted']} inserted, {$result['updated']} updated, {$result['skipped']} skipped",
                'data'    => $result,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            break;
            
        case 'setup_tables':
            // Create/ensure tables exist in Supabase
            $warnings = $sync->ensureSupabaseTables();
            echo json_encode([
                'success'  => true,
                'message'  => 'Supabase tables ensured' . (empty($warnings) ? '' : ' (with warnings)'),
                'warnings' => $warnings,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            break;
            
        default:
            echo json_encode([
                'error'   => true,
                'message' => 'Unknown action. Available: test, verify, sync_all, sync_table, setup_tables',
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
} catch (\PDOException $e) {
    echo json_encode([
        'error'   => true,
        'message' => 'Database error: ' . $e->getMessage(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (\Exception $e) {
    echo json_encode([
        'error'   => true,
        'message' => 'Error: ' . $e->getMessage(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}