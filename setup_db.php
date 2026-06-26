<?php
require_once 'api/db.php';

$sqlFile = 'it-asset-system_schema.sql';

if (!file_exists($sqlFile)) {
    die("SQL schema file not found.");
}

$sql = file_get_contents($sqlFile);

try {
    $pdo->exec($sql);
    echo "Database setup successfully!";
} catch (PDOException $e) {
    echo "Error setting up database: " . $e->getMessage();
}
?>
