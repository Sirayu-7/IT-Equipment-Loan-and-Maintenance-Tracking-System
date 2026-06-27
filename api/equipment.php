<?php
// api/equipment.php
require_once 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM tb_assets ORDER BY asset_id DESC");
    echo json_encode($stmt->fetchAll());
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Add Equipment
    if (isset($data['action']) && $data['action'] === 'add') {
        $stmt = $pdo->prepare("INSERT INTO tb_assets (asset_code, asset_name, description, status) VALUES (?, ?, ?, 'available')");
        $code = 'EQ-' . time();
        $desc = isset($data['description']) ? $data['description'] : null;
        if ($stmt->execute([$code, $data['name'], $desc])) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false]);
        }
    } 
    // Delete Equipment
    elseif (isset($data['action']) && $data['action'] === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM tb_assets WHERE asset_id = ?");
        if ($stmt->execute([$data['id']])) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false]);
        }
    }
}
?>