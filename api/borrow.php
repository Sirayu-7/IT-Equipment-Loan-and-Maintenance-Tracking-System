<?php
// api/borrow.php
require_once 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT t.*, u.full_name as user_name, a.asset_name 
        FROM tb_transactions t
        LEFT JOIN tb_users u ON t.user_id = u.user_id
        LEFT JOIN tb_assets a ON t.asset_id = a.asset_id
        ORDER BY t.trans_id DESC
    ");
    echo json_encode($stmt->fetchAll());
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Add Borrow Request
    if (isset($data['action']) && $data['action'] === 'add') {
        try {
            $pdo->beginTransaction();
            
            // Insert transaction (asset status changes only when staff approves)
            $stmt = $pdo->prepare("INSERT INTO tb_transactions (user_id, asset_id, detail, trans_status) VALUES (?, ?, ?, 'pending')");
            $stmt->execute([$data['user_id'], $data['asset_id'], $data['detail']]);
            
            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    } 
    // Approve/Return Borrow
    elseif (isset($data['action']) && $data['action'] === 'update_status') {
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("UPDATE tb_transactions SET trans_status = ? WHERE trans_id = ?");
            if ($data['status'] === 'returned') {
                $stmt = $pdo->prepare("UPDATE tb_transactions SET trans_status = ?, return_date = NOW() WHERE trans_id = ?");
            }
            $stmt->execute([$data['status'], $data['id']]);
            
            if ($data['status'] === 'approved') {
                $stmtGet = $pdo->prepare("SELECT asset_id FROM tb_transactions WHERE trans_id = ?");
                $stmtGet->execute([$data['id']]);
                $asset_id = $stmtGet->fetchColumn();

                $stmt2 = $pdo->prepare("UPDATE tb_assets SET status = 'borrowed' WHERE asset_id = ?");
                $stmt2->execute([$asset_id]);
            } elseif ($data['status'] === 'returned') {
                // Get asset_id for this transaction
                $stmtGet = $pdo->prepare("SELECT asset_id FROM tb_transactions WHERE trans_id = ?");
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
