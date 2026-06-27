<?php
// api/users.php
require_once 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT user_id, username, full_name, role FROM tb_users ORDER BY user_id DESC");
    echo json_encode($stmt->fetchAll());
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Add User
    if (isset($data['action']) && $data['action'] === 'add') {
        $stmt = $pdo->prepare("INSERT INTO tb_users (username, password, full_name, role) VALUES (?, '123', ?, ?)");
        if ($stmt->execute([$data['username'], $data['name'], $data['role']])) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false]);
        }
    } 
    // Delete User
    elseif (isset($data['action']) && $data['action'] === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM tb_users WHERE user_id = ?");
        if ($stmt->execute([$data['id']])) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false]);
        }
    }
}
?>