const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access denied. No token provided.', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query(
      'SELECT id, employee_code, full_name, email, phone, department_id, avatar_url, status FROM users WHERE id = ? AND status = ?',
      [decoded.userId, 'active']
    );

    if (users.length === 0) {
      return error(res, 'Invalid token. User not found or inactive.', HTTP_STATUS.UNAUTHORIZED);
    }

    // Get user roles
    const [roles] = await pool.query(
      `SELECT r.role_name FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [decoded.userId]
    );

    // Get user permissions
    const [permissions] = await pool.query(
      `SELECT DISTINCT p.permission_code FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
      [decoded.userId]
    );

    req.user = {
      ...users[0],
      roles: roles.map(r => r.role_name),
      permissions: permissions.map(p => p.permission_code),
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired.', HTTP_STATUS.UNAUTHORIZED);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid token.', HTTP_STATUS.UNAUTHORIZED);
    }
    return error(res, 'Authentication failed.', HTTP_STATUS.UNAUTHORIZED);
  }
};

module.exports = authenticate;