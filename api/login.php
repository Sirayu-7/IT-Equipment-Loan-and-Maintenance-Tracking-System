<?php
// api/login.php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    $stmt = $pdo->prepare("SELECT user_id, username, full_name, role FROM tb_users WHERE username = ? AND password = ?");
    $stmt->execute([$username, $password]);
    $user = $stmt->fetch();

    if ($user) {
        $_SESSION['user'] = $user;
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    }
} else {
    // Check auth status
    if (isset($_SESSION['user'])) {
        echo json_encode(["success" => true, "user" => $_SESSION['user']]);
    } else {
        echo json_encode(["success" => false, "message" => "Not logged in"]);
    }
}
?>