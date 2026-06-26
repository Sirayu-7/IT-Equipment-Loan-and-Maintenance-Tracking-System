<?php
// api/db.php
$host = '127.0.0.1';
$db   = 'atc_it_asset_db';
$user = 'root';
$pass = ''; // Default XAMPP password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Keep older databases compatible with dashboard statistics.
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
    // If DB doesn't exist, we'll try to connect without dbname first, useful for setup script
    if (strpos($e->getMessage(), 'Unknown database') !== false) {
        try {
            $pdo = new PDO("mysql:host=$host;charset=$charset", $user, $pass, $options);
        } catch (\PDOException $e2) {
            header('Content-Type: application/json');
            echo json_encode(["error" => "Connection failed: " . $e2->getMessage()]);
            exit;
        }
    } else {
        header('Content-Type: application/json');
        echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
        exit;
    }
}
?>
