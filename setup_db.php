<?php
require_once 'api/db.php';

<<<<<<< HEAD
$sqlFile = 'it-asset-system_schema.sql';
=======
$sqlFile = __DIR__ . '/database/it-asset-system_schema.sql';
>>>>>>> 63b5fbd (initial commit)

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
