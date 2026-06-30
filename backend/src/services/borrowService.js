const pool = require('../config/database');
const { HTTP_STATUS, ASSET_STATUS, BORROW_STATUS, BORROW_ITEM_STATUS } = require('../utils/constants');
const { v4: uuidv4 } = require('uuid');

class BorrowService {
  generateRequestNo() {
    const date = new Date();
    const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BR-${yymmdd}-${random}`;
  }

  async getAll({ page = 1, limit = 20, search, status, requester_id, priority, sort_by = 'created_at', sort_order = 'DESC', user = null }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    // Role-based filtering
    if (user && !user.roles.some(r => ['super_admin', 'it_admin'].includes(r))) {
      where += ' AND (br.requester_id = ? OR br.approver_id = ?)';
      params.push(user.id, user.id);
    }

    if (search) {
      where += ' AND (br.request_no LIKE ? OR u.full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    if (status) {
      where += ' AND br.request_status = ?';
      params.push(status);
    }
    if (requester_id) {
      where += ' AND br.requester_id = ?';
      params.push(requester_id);
    }
    if (priority) {
      where += ' AND br.priority = ?';
      params.push(priority);
    }

    const allowedSort = ['created_at', 'request_date', 'request_status', 'priority', 'needed_from', 'needed_until'];
    const orderCol = allowedSort.includes(sort_by) ? sort_by : 'created_at';
    const orderDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM borrow_requests br
       JOIN users u ON br.requester_id = u.id ${where}`, params
    );

    const [requests] = await pool.query(
      `SELECT br.*, 
              requester.full_name as requester_name, requester.employee_code as requester_code,
              approver.full_name as approver_name
       FROM borrow_requests br
       JOIN users requester ON br.requester_id = requester.id
       LEFT JOIN users approver ON br.approver_id = approver.id
       ${where}
       ORDER BY br.${orderCol} ${orderDir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Get items count for each request
    for (const req of requests) {
      const [items] = await pool.query(
        'SELECT COUNT(*) as item_count FROM borrow_request_items WHERE borrow_request_id = ?',
        [req.id]
      );
      req.item_count = items[0].item_count;
    }

    return {
      borrow_requests: requests,
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
      `SELECT br.*,
              requester.full_name as requester_name, requester.employee_code as requester_code, requester.email as requester_email, requester.phone as requester_phone,
              approver.full_name as approver_name
       FROM borrow_requests br
       JOIN users requester ON br.requester_id = requester.id
       LEFT JOIN users approver ON br.approver_id = approver.id
       WHERE br.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Borrow request not found.' };
    }

    const [items] = await pool.query(
      `SELECT bri.*, a.asset_code, a.asset_name, a.serial_number, a.asset_tag, a.condition_status, a.asset_status, 
              ac.category_name, l.location_name
       FROM borrow_request_items bri
       JOIN assets a ON bri.asset_id = a.id
       LEFT JOIN asset_categories ac ON a.category_id = ac.id
       LEFT JOIN locations l ON a.location_id = l.id
       WHERE bri.borrow_request_id = ?`,
      [id]
    );

    return { ...requests[0], items };
  }

  async create(data, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate request number
      const requestNo = this.generateRequestNo();

      // Insert borrow request
      const [result] = await connection.query(
        `INSERT INTO borrow_requests (request_no, requester_id, request_date, purpose, needed_from, needed_until, 
         request_status, priority, notes)
         VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
        [
          requestNo, userId, data.purpose || null,
          data.needed_from || null, data.needed_until || null,
          BORROW_STATUS.DRAFT, data.priority || 'medium', data.notes || null,
        ]
      );

      const borrowRequestId = result.insertId;

      // Insert borrow items
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          // Validate asset exists
          const [assets] = await connection.query(
            'SELECT id, asset_code, asset_name, asset_status FROM assets WHERE id = ?',
            [item.asset_id]
          );

          if (assets.length === 0) {
            throw { statusCode: HTTP_STATUS.NOT_FOUND, message: `Asset ID ${item.asset_id} not found.` };
          }

          if (assets[0].asset_status !== ASSET_STATUS.AVAILABLE) {
            throw {
              statusCode: HTTP_STATUS.CONFLICT,
              message: `Asset "${assets[0].asset_name}" (${assets[0].asset_code}) is not available. Current status: ${assets[0].asset_status}`,
            };
          }

          await connection.query(
            `INSERT INTO borrow_request_items (borrow_request_id, asset_id, qty, item_status)
             VALUES (?, ?, ?, ?)`,
            [borrowRequestId, item.asset_id, item.qty || 1, BORROW_ITEM_STATUS.PENDING]
          );
        }
      }

      await connection.commit();
      return this.getById(borrowRequestId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async submit(id, userId) {
    const request = await this.getById(id);

    if (request.requester_id !== userId) {
      throw { statusCode: HTTP_STATUS.FORBIDDEN, message: 'You can only submit your own requests.' };
    }

    if (request.request_status !== BORROW_STATUS.DRAFT) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Only draft requests can be submitted.' };
    }

    // Check assets availability
    for (const item of request.items) {
      if (item.asset_status !== ASSET_STATUS.AVAILABLE) {
        throw {
          statusCode: HTTP_STATUS.CONFLICT,
          message: `Asset "${item.asset_name}" is not available (${item.asset_status}).`,
        };
      }
    }

    await pool.query(
      'UPDATE borrow_requests SET request_status = ? WHERE id = ?',
      [BORROW_STATUS.SUBMITTED, id]
    );

    // Log audit
    await this.logAudit(userId, 'submit', 'borrow_request', id, request.request_status, BORROW_STATUS.SUBMITTED);

    return this.getById(id);
  }

  async approve(id, approverId, notes) {
    const request = await this.getById(id);

    if (request.request_status !== BORROW_STATUS.SUBMITTED) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Only submitted requests can be approved.' };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update request
      await connection.query(
        'UPDATE borrow_requests SET request_status = ?, approver_id = ?, notes = COALESCE(?, notes) WHERE id = ?',
        [BORROW_STATUS.APPROVED, approverId, notes || null, id]
      );

      // Reserve the assets
      for (const item of request.items) {
        await connection.query(
          'UPDATE assets SET asset_status = ? WHERE id = ? AND asset_status = ?',
          [ASSET_STATUS.RESERVED, item.asset_id, ASSET_STATUS.AVAILABLE]
        );
      }

      await connection.commit();

      // Log audit
      await this.logAudit(approverId, 'approve', 'borrow_request', id, request.request_status, BORROW_STATUS.APPROVED);

      // Create notification for requester
      await this.createNotification(request.requester_id,
        'Borrow Request Approved',
        `Your borrow request ${request.request_no} has been approved.`
      );

      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async reject(id, approverId, reason) {
    const request = await this.getById(id);

    if (request.request_status !== BORROW_STATUS.SUBMITTED) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Only submitted requests can be rejected.' };
    }

    await pool.query(
      'UPDATE borrow_requests SET request_status = ?, approver_id = ?, rejected_reason = ?, request_status = ? WHERE id = ?',
      [BORROW_STATUS.REJECTED, approverId, reason || null, id]
    );

    // Correction: Use proper update
    await pool.query(
      'UPDATE borrow_requests SET request_status = ?, approver_id = ?, rejected_reason = ? WHERE id = ?',
      [BORROW_STATUS.REJECTED, approverId, reason || null, id]
    );

    await this.logAudit(approverId, 'reject', 'borrow_request', id, request.request_status, BORROW_STATUS.REJECTED);

    await this.createNotification(request.requester_id,
      'Borrow Request Rejected',
      `Your borrow request ${request.request_no} has been rejected. Reason: ${reason || 'Not specified'}`
    );

    return this.getById(id);
  }

  async confirmBorrow(id, userId) {
    const request = await this.getById(id);

    if (request.request_status !== BORROW_STATUS.APPROVED) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Only approved requests can be confirmed as borrowed.' };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE borrow_requests SET request_status = ? WHERE id = ?',
        [BORROW_STATUS.BORROWED, id]
      );

      for (const item of request.items) {
        await connection.query(
          'UPDATE borrow_request_items SET item_status = ?, borrow_date = CURDATE(), due_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY) WHERE id = ?',
          [BORROW_ITEM_STATUS.BORROWED, item.id]
        );

        await connection.query(
          'UPDATE assets SET asset_status = ? WHERE id = ?',
          [ASSET_STATUS.BORROWED, item.asset_id]
        );

        await connection.query(
          `INSERT INTO asset_history (asset_id, action_type, reference_type, reference_id, action_by, remark)
           VALUES (?, 'borrowed', 'borrow_request', ?, ?, 'Asset borrowed')`,
          [item.asset_id, id, userId]
        );
      }

      await connection.commit();
      await this.logAudit(userId, 'borrow_confirm', 'borrow_request', id, BORROW_STATUS.APPROVED, BORROW_STATUS.BORROWED);

      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async returnAssets(id, userId, returnData) {
    const request = await this.getById(id);

    if (![BORROW_STATUS.BORROWED, BORROW_STATUS.APPROVED].includes(request.request_status)) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Request is not in a borrowable state for return.' };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const ret of returnData.items) {
        const item = request.items.find(i => i.id === ret.item_id);
        if (!item) {
          throw { statusCode: HTTP_STATUS.NOT_FOUND, message: `Item ID ${ret.item_id} not found in this request.` };
        }

        const newAssetStatus = ret.condition === 'damaged' || ret.condition === 'lost'
          ? (ret.condition === 'lost' ? ASSET_STATUS.LOST : ASSET_STATUS.DAMAGED)
          : ASSET_STATUS.AVAILABLE;

        await connection.query(
          `UPDATE borrow_request_items SET item_status = ?, returned_date = CURDATE(), return_condition = ?, notes = ?
           WHERE id = ?`,
          [ret.condition === 'lost' ? BORROW_ITEM_STATUS.LOST : BORROW_ITEM_STATUS.RETURNED,
           ret.condition || 'good', ret.notes || null, item.id]
        );

        await connection.query(
          'UPDATE assets SET asset_status = ?, condition_status = ? WHERE id = ?',
          [newAssetStatus, ret.condition || 'good', item.asset_id]
        );

        await connection.query(
          `INSERT INTO asset_history (asset_id, action_type, reference_type, reference_id, action_by, remark)
           VALUES (?, 'returned', 'borrow_request', ?, ?, ?)`,
          [item.asset_id, id, userId, `Returned with condition: ${ret.condition || 'good'}`]
        );

        // Create repair request if damaged
        if (ret.condition === 'damaged') {
          const [repairResult] = await connection.query(
            `INSERT INTO repair_requests (repair_no, requested_by, asset_id, issue_type, issue_detail, priority, repair_status)
             VALUES (?, ?, ?, 'damaged_on_return', ?, 'medium', 'reported')`,
            [this.generateRepairNo(), userId, item.asset_id,
             `Asset returned damaged from borrow request ${request.request_no}. Condition notes: ${ret.notes || 'N/A'}`
            ]
          );

          await connection.query(
            `INSERT INTO asset_history (asset_id, action_type, reference_type, reference_id, action_by, remark)
             VALUES (?, 'repair_created', 'repair_request', ?, ?, 'Auto-created from damaged return')`,
            [item.asset_id, repairResult.insertId, userId]
          );
        }
      }

      // Check if all items are returned
      const [pendingItems] = await connection.query(
        'SELECT COUNT(*) as count FROM borrow_request_items WHERE borrow_request_id = ? AND item_status IN (?, ?)',
        [id, BORROW_ITEM_STATUS.PENDING, BORROW_ITEM_STATUS.BORROWED]
      );

      if (parseInt(pendingItems[0].count) === 0) {
        await connection.query(
          'UPDATE borrow_requests SET request_status = ? WHERE id = ?',
          [BORROW_STATUS.RETURNED, id]
        );
      }

      await connection.commit();

      await this.createNotification(request.requester_id,
        'Borrow Return Processed',
        `Items from borrow request ${request.request_no} have been returned.`
      );

      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async cancel(id, userId) {
    const request = await this.getById(id);

    if (![BORROW_STATUS.DRAFT, BORROW_STATUS.SUBMITTED].includes(request.request_status)) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Only draft or submitted requests can be cancelled.' };
    }

    if (request.requester_id !== userId) {
      throw { statusCode: HTTP_STATUS.FORBIDDEN, message: 'You can only cancel your own requests.' };
    }

    await pool.query(
      'UPDATE borrow_requests SET request_status = ? WHERE id = ?',
      [BORROW_STATUS.CANCELLED, id]
    );

    await this.logAudit(userId, 'cancel', 'borrow_request', id, request.request_status, BORROW_STATUS.CANCELLED);

    return this.getById(id);
  }

  generateRepairNo() {
    const date = new Date();
    const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RR-${yymmdd}-${random}`;
  }

  async logAudit(userId, action, entityType, entityId, oldValue, newValue) {
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, action_type, entity_type, entity_id, old_value, new_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, oldValue || null, newValue || null]
    );
  }

  async createNotification(userId, title, message) {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, ?)',
      [userId, title, message, 'in_app']
    );
  }

  async getOverdueItems() {
    const [items] = await pool.query(
      `SELECT bri.*, br.request_no, a.asset_code, a.asset_name, 
              u.full_name as borrower_name, u.employee_code, u.email, u.phone
       FROM borrow_request_items bri
       JOIN borrow_requests br ON bri.borrow_request_id = br.id
       JOIN assets a ON bri.asset_id = a.id
       JOIN users u ON br.requester_id = u.id
       WHERE bri.item_status = 'borrowed' AND bri.due_date < CURDATE()
       ORDER BY bri.due_date ASC`
    );
    return items;
  }
}

module.exports = new BorrowService();