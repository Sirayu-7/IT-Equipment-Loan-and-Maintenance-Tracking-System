<?php
require_once __DIR__ . '/lib/Database.php';

$db = Database::getInstance();

if ($db->isPostgres()) {
    // Use the Supabase (PostgreSQL) schema
    $sql = Database::getSupabaseSchema();
    
    try {
        // Execute schema statements one by one
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        foreach ($statements as $statement) {
            if (!empty($statement) && stripos($statement, '--') !== 0) {
                $pdo = $db->getConnection();
                $pdo->exec($statement);
            }
        }
        echo "Database setup successfully! (PostgreSQL/Supabase)\n";
    } catch (PDOException $e) {
        echo "Error setting up database: " . $e->getMessage() . "\n";
    }
} else {
    // MySQL setup - use existing schema file
    $sqlFile = __DIR__ . '/database/it-asset-system_schema.sql';
    
    if (!file_exists($sqlFile)) {
        // Try alternate location
        $sqlFile = 'it-asset-system_schema.sql';
        if (!file_exists($sqlFile)) {
            die("SQL schema file not found. Create a 'database/it-asset-system_schema.sql' or run the Supabase setup from the SQL editor.\n");
        }
    }

    $sql = file_get_contents($sqlFile);

    try {
        $pdo = $db->getConnection();
        $pdo->exec($sql);
        echo "Database setup successfully! (MySQL/XAMPP)\n";
    } catch (PDOException $e) {
        echo "Error setting up database: " . $e->getMessage() . "\n";
    }
}
?>