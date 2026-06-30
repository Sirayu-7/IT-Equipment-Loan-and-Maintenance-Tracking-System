const pool = require('../config/database');

class NotificationService {
  async getByUser(userId, { page = 1, limit = 20, is_read = null }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE user_id = ?';
    const params = [userId];

    if (is_read !== null) {
      where += ' AND is_read = ?';
      params.push(is_read === 'true' || is_read === true ? 1 : 0);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications ${where}`, params
    );

    const [notifications] = await pool.query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      notifications,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  async getUnreadCount(userId) {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result[0].count;
  }

  async markAsRead(notificationId, userId) {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return { message: 'Notification marked as read.' };
  }

  async markAllAsRead(userId) {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return { message: 'All notifications marked as read.' };
  }

  async create(userId, title, message, referenceType = null, referenceId = null) {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
      [userId, title, message, referenceType, referenceId]
    );
    return result.insertId;
  }
}

module.exports = new NotificationService();