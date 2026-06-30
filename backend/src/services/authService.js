const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

class AuthService {
  async login(email, password) {
    const [users] = await pool.query(
      'SELECT id, employee_code, full_name, email, password_hash, phone, department_id, avatar_url, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid email or password.' };
    }

    const user = users[0];
    if (user.status !== 'active') {
      throw { statusCode: HTTP_STATUS.FORBIDDEN, message: 'Account is inactive or suspended.' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid email or password.' };
    }

    // Get user roles
    const [roles] = await pool.query(
      `SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [user.id]
    );

    // Get user permissions
    const [permissions] = await pool.query(
      `SELECT DISTINCT p.permission_code FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
      [user.id]
    );

    // Get department
    const [departments] = await pool.query(
      'SELECT id, department_name FROM departments WHERE id = ?',
      [user.department_id]
    );

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roles: roles.map(r => r.role_name),
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Remove password_hash from output
    const { password_hash, ...userData } = user;

    return {
      user: {
        ...userData,
        department: departments[0] || null,
        roles: roles.map(r => r.role_name),
        permissions: permissions.map(p => p.permission_code),
      },
      token,
      refreshToken,
    };
  }

  async getProfile(userId) {
    const [users] = await pool.query(
      `SELECT u.*, d.department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'User not found.' };
    }

    const [roles] = await pool.query(
      `SELECT r.role_name, r.description FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [userId]
    );

    const { password_hash, ...userData } = users[0];
    return { ...userData, roles: roles.map(r => r.role_name) };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'User not found.' };
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Current password is incorrect.' };
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);

    return { message: 'Password changed successfully.' };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'refresh') {
        throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid refresh token.' };
      }

      const [users] = await pool.query(
        'SELECT id, email FROM users WHERE id = ? AND status = ?',
        [decoded.userId, 'active']
      );

      if (users.length === 0) {
        throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'User not found or inactive.' };
      }

      // Get roles for new token
      const [roles] = await pool.query(
        `SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
        [decoded.userId]
      );

      const newToken = jwt.sign(
        { userId: decoded.userId, email: users[0].email, roles: roles.map(r => r.role_name) },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      return { token: newToken };
    } catch (err) {
      if (err.statusCode) throw err;
      throw { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid or expired refresh token.' };
    }
  }
}

module.exports = new AuthService();