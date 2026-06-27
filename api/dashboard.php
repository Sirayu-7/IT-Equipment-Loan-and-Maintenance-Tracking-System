<?php
// api/dashboard.php
require_once 'db.php';
header('Content-Type: application/json');

try {
    // Determine date interval SQL for each database type
    if ($db->isPostgres()) {
        // PostgreSQL date expressions
        $dateExpr = "CURRENT_DATE - INTERVAL '6 days'";
        $dateGroupExpr = "DATE(borrow_date)";
        $dateReturnExpr = "DATE(return_date)";
        $dateRepairExpr = "DATE(report_date)";
    } else {
        // MySQL date expressions
        $dateExpr = "DATE(NOW()) - INTERVAL 6 DAY";
        $dateGroupExpr = "DATE(borrow_date)";
        $dateReturnExpr = "DATE(return_date)";
        $dateRepairExpr = "DATE(report_date)";
    }

    // Borrow counts by day (new requests, last 7 days)
    $stmtBorrow = $pdo->query("
        SELECT {$dateGroupExpr} as date, COUNT(*) as count 
        FROM tb_transactions 
        WHERE borrow_date >= {$dateExpr}
        GROUP BY {$dateGroupExpr}
    ");
    $borrowByDate = [];
    foreach ($stmtBorrow->fetchAll() as $row) {
        $borrowByDate[$row['date']] = (int) $row['count'];
    }

    // Return counts by day (last 7 days)
    $stmtReturn = $pdo->query("
        SELECT {$dateReturnExpr} as date, COUNT(*) as count 
        FROM tb_transactions 
        WHERE return_date IS NOT NULL 
          AND return_date >= {$dateExpr}
        GROUP BY {$dateReturnExpr}
    ");
    $returnByDate = [];
    foreach ($stmtReturn->fetchAll() as $row) {
        $returnByDate[$row['date']] = (int) $row['count'];
    }

    // Repair request counts by day (last 7 days)
    $stmtRepair = $pdo->query("
        SELECT {$dateRepairExpr} as date, COUNT(*) as count
        FROM tb_repairs
        WHERE report_date >= {$dateExpr}
        GROUP BY {$dateRepairExpr}
    ");
    $repairByDate = [];
    foreach ($stmtRepair->fetchAll() as $row) {
        $repairByDate[$row['date']] = (int) $row['count'];
    }

    // Build full 7-day series (today + 6 days back)
    $borrowStats = [];
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-{$i} days"));
        $borrowStats[] = [
            'date' => $date,
            'borrow' => $borrowByDate[$date] ?? 0,
            'return' => $returnByDate[$date] ?? 0,
            'repair' => $repairByDate[$date] ?? 0,
        ];
    }

    // Active borrow + pending repair counts (for stat cards & pie chart)
    $activeBorrows = $pdo->query("
        SELECT COUNT(*) FROM tb_transactions 
        WHERE trans_status IN ('pending', 'approved')
    ")->fetchColumn();
    $pendingRepairs = $pdo->query("
        SELECT COUNT(*) FROM tb_repairs 
        WHERE repair_status = 'pending'
    ")->fetchColumn();
    
    // Overall counts
    $eqCount = $pdo->query("SELECT COUNT(*) FROM tb_assets")->fetchColumn();
    $userCount = $pdo->query("SELECT COUNT(*) FROM tb_users")->fetchColumn();

    echo json_encode([
        "success" => true,
        "borrow_stats" => $borrowStats,
        "status_counts" => [
            "active_borrows" => (int) $activeBorrows,
            "pending_repairs" => (int) $pendingRepairs
        ],
        "counts" => [
            "equipment" => $eqCount,
            "users" => $userCount
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>