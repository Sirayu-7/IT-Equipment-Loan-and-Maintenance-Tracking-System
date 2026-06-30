const pool = require('../config/database');
const { HTTP_STATUS, REPAIR_STATUS, ASSET_STATUS } = require('../utils/constants');

class RepairService {
  generateRepairNo() {
    const date = new Date();
    const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RR-${yymmdd}-${random}`;
  }

  async getAll({ page = 1, limit = 20, search, status, priority, assigned_to, asset_id, sort_by = 'reported_at', sort_order = 'DESC', user = null }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (user && user.roles.includes('it_technician') && !user.roles.some(r => ['super_admin', 'it_admin'].includes(r))) {
      where += ' AND (rr.assigned_to = ? OR rr.requested_by = ?)';
      params.push(user.id, user.id);
    } else if (user && user.roles.includes('employee') && !user.roles.some(r => ['super_admin', 'it_admin', 'it_technician', 'approver'].includes(r))) {
      where += ' AND rr.requested_by = ?';
      params.push(user.id);
    }

    if (search) {
      where += ' AND (rr.repair_no LIKE ? OR a.asset_code LIKE ? OR a.asset_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (status) { where += ' AND rr.repair_status = ?'; params.push(status); }
    if (priority) { where += ' AND rr.priority = ?'; params.push(priority); }
    if (assigned_to) { where += ' AND rr.assigned_to = ?'; params.push(assigned_to); }
    if (asset_id) { where += ' AND rr.asset_id = ?'; params.push(asset_id); }

    const allowedSort = ['reported_at', 'repair_status', 'priority', 'created_at'];
    const orderCol = allowedSort.includes(sort_by) ? sort_by : 'reported_at';
    const orderDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM repair_requests rr
       JOIN assets a ON rr.asset_id = a.id ${where}`, params
    );

    const [requests] = await pool.query(
      `SELECT rr.*, 
              a.asset_code, a.asset_name, a.serial_number,
              req.full_name as requested_by_name,
              tech.full_name as assigned_to_name,
              ac.category_name
       FROM repair_requests rr
       JOIN assets a ON rr.asset_id = a.id
       JOIN users req ON rr.requested_by = req.id
       LEFT JOIN users tech ON rr.assigned_to = tech.id
       LEFT JOIN asset_categories ac ON a.category_id = ac.id
       ${where}
       ORDER BY rr.${orderCol} ${orderDir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      repair_requests: requests,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  async getById(id) {
    const [requests] = await pool.query(
      `SELECT rr.*,
              a.asset_code, a.asset_name, a.serial_number, a.asset_status as asset_current_status, a.condition_status as asset_condition,
              a.brand, a.model,
              req.full_name as requested_by_name, req.employee_code as requested_by_code,
              tech.full_name as assigned_to_name,
              ac.category_name, l.location_name
       FROM repair_requests rr
       JOIN assets a ON rr.asset_id = a.id
       JOIN users req ON rr.requested_by = req.id
       LEFT JOIN users tech ON rr.assigned_to = tech.id
       LEFT JOIN asset_categories ac ON a.category_id = ac.id
       LEFT JOIN locations l ON a.location_id = l.id
       WHERE rr.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Repair request not found.' };
    }

    // Get repair logs
    const [logs] = await pool.query(
      `SELECT rl.*, u.full_name as action_by_name
       FROM repair_logs rl
       LEFT JOIN users u ON rl.action_by = u.id
       WHERE rl.repair_request_id = ?
       ORDER BY rl.action_at DESC`,
      [id]
    );

    return { ...requests[0], logs };
  }

  async create(data, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const repairNo = this.generateRepairNo();

      // Validate asset exists and is not already under repair
      const [assets] = await connection.query(
        'SELECT id, asset_code, asset_name, asset_status FROM assets WHERE id = ?',
        [data.asset_id]
      );

      if (assets.length === 0) {
        throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Asset not found.' };
      }

      const [result] = await connection.query(
        `INSERT INTO repair_requests (repair_no, requested_by, asset_id, issue_type, issue_detail, priority, repair_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [repairNo, userId, data.asset_id, data.issue_type || null, data.issue_detail || null,
         data.priority || 'medium', REPAIR_STATUS.REPORTED]
      );

      // Update asset status if available or borrowed
      const asset = assets[0];
      if (['available', 'borrowed', 'damaged'].includes(asset.asset_status)) {
        await connection.query(
          'UPDATE assets SET asset_status = ? WHERE id = ?',
          [ASSET_STATUS.PENDING_REPAIR, data.asset_id]
        );
      }

      // Add repair log
      await connection.query(
        `INSERT INTO repair_logs (repair_request_id, status_from, status_to, action_by, comment)
         VALUES (?, NULL, ?, ?, ?)`,
        [result.insertId, REPAIR_STATUS.REPORTED, userId, 'Repair request created']
      );

      await connection.query(
        `INSERT INTO asset_history (asset_id, action_type, reference_type, reference_id, action_by, remark)
         VALUES (?, 'repair_requested', 'repair_request', ?, ?, 'Repair request created')`,
        [data.asset_id, result.insertId, userId]
      );

      await connection.commit();
      return this.getById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateStatus(id, userId, status, comment) {
    const request = await this.getById(id);

    const validTransitions = {
      [REPAIR_STATUS.REPORTED]: [REPAIR_STATUS.ACCEPTED, REPAIR_STATUS.REJECTED],
      [REPAIR_STATUS.ACCEPTED]: [REPAIR_STATUS.IN_PROGRESS, REPAIR_STATUS.WAITING_PARTS],
      [REPAIR_STATUS.IN_PROGRESS]: [REPAIR_STATUS.WAITING_PARTS, REPAIR_STATUS.FIXED],
      [REPAIR_STATUS.WAITING_PARTS]: [REPAIR_STATUS.IN_PROGRESS, REPAIR_STATUS.FIXED],
      [REPAIR_STATUS.FIXED]: [REPAIR_STATUS.CLOSED],
    };

    if (!validTransitions[request.repair_status] || !validTransitions[request.repair_status].includes(status)) {
      throw {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Cannot transition from "${request.repair_status}" to "${status}".`,
      };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE repair_requests SET repair_status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );

      if (status === REPAIR_STATUS.ACCEPTED) {
        await connection.query(
          'UPDATE repair_requests SET accepted_at = NOW(), assigned_to = ? WHERE id = ?',
          [userId, id]
        );
        await connection.query(
          'UPDATE assets SET asset_status = ? WHERE id = ?',
          [ASSET_STATUS.UNDER_REPAIR, request.asset_id]
        );
      }

      if (status === REPAIR_STATUS.FIXED) {
        await connection.query(
          'UPDATE repair_requests SET completed_at = NOW() WHERE id = ?',
          [id]
        );
        await connection.query(
          'UPDATE assets SET asset_status = ?, condition_status = ? WHERE id = ?',
          [ASSET_STATUS.AVAILABLE, 'good', request.asset_id]
        );
      }

      if (status === REPAIR_STATUS.REJECTED) {
        await connection.query(
          'UPDATE assets SET asset_status = ? WHERE id = ?',
          [ASSET_STATUS.AVAILABLE, request.asset_id]
        );
      }

      if (status === REPAIR_STATUS.CLOSED) {
        await connection.query(
          'UPDATE assets SET asset_status = ? WHERE id = ?',
          [ASSET_STATUS.AVAILABLE, request.asset_id]
        );
      }

      await connection.query(
        `INSERT INTO repair_logs (repair_request_id, status_from, status_to, action_by, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [id, request.repair_status, status, userId, comment || null]
      );

      await connection.query(
        `INSERT INTO asset_history (asset_id, action_type, reference_type, reference_id, action_by, remark)
         VALUES (?, 'repair_status_change', 'repair_request', ?, ?, ?)`,
        [request.asset_id, id, userId, `Status changed from ${request.repair_status} to ${status}`]
      );

      await connection.commit();
      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close(id, userId, resolution, costActual) {
    const request = await this.getById(id);

    if (request.repair_status !== REPAIR_STATUS.FIXED) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Only fixed repairs can be closed.' };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE repair_requests SET repair_status = ?, completed_at = NOW(), resolution_detail = ?, cost_actual = ?
         WHERE id = ?`,
        [REPAIR_STATUS.CLOSED, resolution || null, costActual || null, id]
      );

      await connection.query(
        'UPDATE assets SET asset_status = ? WHERE id = ?',
        [ASSET_STATUS.AVAILABLE, request.asset_id]
      );

      await connection.query(
        `INSERT INTO repair_logs (repair_request_id, status_from, status_to, action_by, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [id, REPAIR_STATUS.FIXED, REPAIR_STATUS.CLOSED, userId, resolution || 'Repair completed']
      );

      await connection.commit();
      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async assign(id, userId, technicianId) {
    const request = await this.getById(id);

    await pool.query(
      'UPDATE repair_requests SET assigned_to = ? WHERE id = ?',
      [technicianId, id]
    );

    await pool.query(
      `INSERT INTO repair_logs (repair_request_id, status_from, status_to, action_by, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [id, request.repair_status, request.repair_status, userId, `Assigned to technician ID ${technicianId}`]
    );

    return this.getById(id);
  }

  async cancel(id, userId, reason) {
    const request = await this.getById(id);

    const cancellableStatuses = ['reported', 'accepted', 'waiting_parts'];
    if (!cancellableStatuses.includes(request.repair_status)) {
      throw {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Cannot cancel repair in "${request.repair_status}" status.`,
      };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE repair_requests SET repair_status = ?, notes = CONCAT(IFNULL(notes, ''), ?, ?) WHERE id = ?",
        [REPAIR_STATUS.CANCELLED, '\nCancelled: ', reason || 'Cancelled by admin', id]
      );

      // Release asset from repair
      await connection.query(
        'UPDATE assets SET asset_status = ? WHERE id = ?',
        [ASSET_STATUS.AVAILABLE, request.asset_id]
      );

      await connection.query(
        `INSERT INTO repair_logs (repair_request_id, status_from, status_to, action_by, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [id, request.repair_status, REPAIR_STATUS.CANCELLED, userId, reason || 'Cancelled by admin']
      );

      // Release any reserved parts for this repair
      const [reservations] = await connection.query(
        "SELECT pr.id, pr.part_id, (pr.qty_reserved - IFNULL(pr.qty_used, 0)) as qty_to_release FROM part_reservations pr WHERE pr.repair_request_id = ? AND pr.status = 'reserved'",
        [id]
      );

      for (const res of reservations) {
        await connection.query(
          'UPDATE part_reservations SET status = ? WHERE id = ?',
          ['cancelled', res.id]
        );
        if (res.qty_to_release > 0) {
          await connection.query(
            'UPDATE parts SET reserved_stock = GREATEST(reserved_stock - ?, 0) WHERE id = ?',
            [res.qty_to_release, res.part_id]
          );
        }
      }

      await connection.commit();
      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new RepairService();
