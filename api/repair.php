<?php
// api/repair.php
require_once 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT r.*, u.full_name as user_name, a.asset_name 
        FROM tb_repairs r
        LEFT JOIN tb_users u ON r.user_id = u.user_id
        LEFT JOIN tb_assets a ON r.asset_id = a.asset_id
        ORDER BY r.repair_id DESC
    ");
    echo json_encode($stmt->fetchAll());
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Add Repair Request
    if (isset($data['action']) && $data['action'] === 'add') {
        try {
            $pdo->beginTransaction();
            
            // Insert repair request
            $stmt = $pdo->prepare("INSERT INTO tb_repairs (user_id, asset_id, detail, repair_status) VALUES (?, ?, ?, 'pending')");
            $stmt->execute([$data['user_id'], $data['asset_id'], $data['detail']]);
            
            // Update asset status
            $stmt2 = $pdo->prepare("UPDATE tb_assets SET status = 'repairing' WHERE asset_id = ?");
            $stmt2->execute([$data['asset_id']]);
            
            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    } 
    // Mark as Fixed
    elseif (isset($data['action']) && $data['action'] === 'update_status') {
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("UPDATE tb_repairs SET repair_status = ? WHERE repair_id = ?");
            $stmt->execute([$data['status'], $data['id']]);
            
            if ($data['status'] === 'fixed') {
                // Get asset_id for this repair
                $stmtGet = $pdo->prepare("SELECT asset_id FROM tb_repairs WHERE repair_id = ?");
                $stmtGet->execute([$data['id']]);
                $asset_id = $stmtGet->fetchColumn();
                
                // Update asset status back to available
                $stmt2 = $pdo->prepare("UPDATE tb_assets SET status = 'available' WHERE asset_id = ?");
                $stmt2->execute([$asset_id]);
            }
            
            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(["success" => false]);
        }
    }
}
?>