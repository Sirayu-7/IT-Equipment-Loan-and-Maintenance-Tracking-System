const pool = require('../config/database');

class DashboardService {
  async getAdminSummary({ department_id, date_from, date_to, user = null }) {
    const params = [];
    let deptFilter = '';
    if (department_id && user && (user.roles.includes('super_admin') || user.roles.includes('it_admin'))) {
      deptFilter = ' AND d.id = ?';
      params.push(department_id);
    }

    // Total assets
    const [totalAssets] = await pool.query(
      `SELECT COUNT(*) as total FROM assets a
       LEFT JOIN locations l ON a.location_id = l.id
       WHERE 1=1 ${deptFilter ? '' : ''}`
    );

    // Available assets
    const [availableAssets] = await pool.query(
      'SELECT COUNT(*) as total FROM assets WHERE asset_status = ?', ['available']
    );

    // Borrowed assets
    const [borrowedAssets] = await pool.query(
      'SELECT COUNT(*) as total FROM assets WHERE asset_status = ?', ['borrowed']
    );

    // Under repair
    const [underRepair] = await pool.query(
      'SELECT COUNT(*) as total FROM assets WHERE asset_status IN (?, ?)',
      ['under_repair', 'pending_repair']
    );

    // Overdue borrows
    const [overdueBorrows] = await pool.query(
      `SELECT COUNT(*) as total FROM borrow_request_items 
       WHERE item_status = ? AND due_date < CURDATE()`,
      ['borrowed']
    );

    // Open repairs
    const [openRepairs] = await pool.query(
      "SELECT COUNT(*) as total FROM repair_requests WHERE repair_status NOT IN ('closed', 'rejected')"
    );

    // Completed repairs this month
    const [completedRepairs] = await pool.query(
      `SELECT COUNT(*) as total FROM repair_requests 
       WHERE repair_status = 'closed' 
       AND MONTH(completed_at) = MONTH(CURDATE()) 
       AND YEAR(completed_at) = YEAR(CURDATE())`
    );

    // Pending approvals
    const [pendingApprovals] = await pool.query(
      "SELECT COUNT(*) as total FROM borrow_requests WHERE request_status = 'submitted'"
    );

    // Active users
    const [activeUsers] = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE status = 'active'"
    );

    // Warranty expiring soon (next 30 days)
    const [warrantyExpiring] = await pool.query(
      `SELECT COUNT(*) as total FROM assets 
       WHERE warranty_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
    );

    return {
      total_assets: totalAssets[0].total,
      available_assets: availableAssets[0].total,
      borrowed_assets: borrowedAssets[0].total,
      under_repair_assets: parseInt(underRepair[0].total),
      overdue_borrows: overdueBorrows[0].total,
      open_repairs: openRepairs[0].total,
      completed_repairs_month: completedRepairs[0].total,
      pending_approvals: pendingApprovals[0].total,
      active_users: activeUsers[0].total,
      warranty_expiring_soon: warrantyExpiring[0].total,
    };
  }

  async getAssetStatusDistribution() {
    const [statuses] = await pool.query(
      `SELECT asset_status, COUNT(*) as count 
       FROM assets 
       GROUP BY asset_status 
       ORDER BY count DESC`
    );
    return statuses;
  }

  async getBorrowTrends({ days = 30, department_id = null }) {
    let where = '';
    const params = [];
    if (department_id) {
      where = ' AND u.department_id = ?';
      params.push(department_id);
    }

    const [trends] = await pool.query(
      `SELECT DATE(br.created_at) as date, COUNT(*) as total
       FROM borrow_requests br
       JOIN users u ON br.requester_id = u.id
       WHERE br.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${where}
       GROUP BY DATE(br.created_at)
       ORDER BY date ASC`,
      [parseInt(days), ...params]
    );

    return trends;
  }

  async getRepairTrends({ days = 30, department_id = null }) {
    let where = '';
    const params = [];
    if (department_id) {
      where = ' AND u.department_id = ?';
      params.push(department_id);
    }

    const [trends] = await pool.query(
      `SELECT DATE(rr.created_at) as date, COUNT(*) as total
       FROM repair_requests rr
       JOIN users u ON rr.requested_by = u.id
       WHERE rr.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${where}
       GROUP BY DATE(rr.created_at)
       ORDER BY date ASC`,
      [parseInt(days), ...params]
    );

    return trends;
  }

  async getAssetsByCategory() {
    const [categories] = await pool.query(
      `SELECT ac.category_name, COUNT(*) as total
       FROM assets a
       JOIN asset_categories ac ON a.category_id = ac.id
       GROUP BY ac.category_name
       ORDER BY total DESC`
    );
    return categories;
  }

  async getOverdueItems() {
    const [items] = await pool.query(
      `SELECT bri.*, br.request_no, a.asset_code, a.asset_name, 
              u.full_name as borrower_name, u.email, u.phone
       FROM borrow_request_items bri
       JOIN borrow_requests br ON bri.borrow_request_id = br.id
       JOIN assets a ON bri.asset_id = a.id
       JOIN users u ON br.requester_id = u.id
       WHERE bri.item_status = 'borrowed' AND bri.due_date < CURDATE()
       ORDER BY bri.due_date ASC
       LIMIT 20`
    );
    return items;
  }

  async getLatestActivities({ limit = 20, department_id = null }) {
    const activities = [];

    // Latest borrow requests
    const [borrows] = await pool.query(
      `SELECT CONCAT('Borrow: ', br.request_no) as title, 
              CONCAT('Status: ', br.request_status) as description,
              br.created_at as timestamp, br.request_status as status,
              'borrow' as type, br.id as reference_id
       FROM borrow_requests br
       ORDER BY br.created_at DESC LIMIT ?`,
      [parseInt(limit)]
    );
    activities.push(...borrows);

    // Latest repair requests
    const [repairs] = await pool.query(
      `SELECT CONCAT('Repair: ', rr.repair_no) as title,
              CONCAT('Status: ', rr.repair_status) as description,
              rr.created_at as timestamp, rr.repair_status as status,
              'repair' as type, rr.id as reference_id
       FROM repair_requests rr
       ORDER BY rr.created_at DESC LIMIT ?`,
      [parseInt(limit)]
    );
    activities.push(...repairs);

    // Sort combined by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return activities.slice(0, parseInt(limit));
  }

  async getWarrantyExpiringSoon({ days = 30 }) {
    const [assets] = await pool.query(
      `SELECT a.*, ac.category_name
       FROM assets a
       LEFT JOIN asset_categories ac ON a.category_id = ac.id
       WHERE a.warranty_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY a.warranty_end_date ASC`,
      [parseInt(days)]
    );
    return assets;
  }
}

module.exports = new DashboardService();