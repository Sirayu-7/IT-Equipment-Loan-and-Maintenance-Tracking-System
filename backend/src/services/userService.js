const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

class UserService {
  async getAll({ page = 1, limit = 20, search, status, department_id, role_id, sort_by = 'created_at', sort_order = 'DESC' }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.employee_code LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (status) { where += ' AND u.status = ?'; params.push(status); }
    if (department_id) { where += ' AND u.department_id = ?'; params.push(department_id); }
    if (role_id) {
      where += ' AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role_id = ?)';
      params.push(role_id);
    }

    const allowedSort = ['created_at', 'full_name', 'email', 'employee_code', 'status'];
    const orderCol = allowedSort.includes(sort_by) ? sort_by : 'created_at';
    const orderDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${where}`, params
    );

    const [users] = await pool.query(
      `SELECT u.id, u.employee_code, u.full_name, u.email, u.phone, u.department_id, u.avatar_url, u.status, u.created_at, u.updated_at,
              d.department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ${where}
       ORDER BY u.${orderCol} ${orderDir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Get roles for each user
    for (const user of users) {
      const [roles] = await pool.query(
        `SELECT r.id, r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
        [user.id]
      );
      user.roles = roles;
    }

    return {
      users,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  async getById(id) {
    const [users] = await pool.query(
      `SELECT u.*, d.department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'User not found.' };
    }

    const [roles] = await pool.query(
      `SELECT r.id, r.role_name, r.description FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [id]
    );

    const { password_hash, ...userData } = users[0];
    return { ...userData, roles };
  }

  async create(data) {
    // Check duplicate email
    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existingEmail.length > 0) {
      throw { statusCode: HTTP_STATUS.CONFLICT, message: 'Email already exists.' };
    }

    const [existingCode] = await pool.query('SELECT id FROM users WHERE employee_code = ?', [data.employee_code]);
    if (existingCode.length > 0) {
      throw { statusCode: HTTP_STATUS.CONFLICT, message: 'Employee code already exists.' };
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password || 'changeme123', salt);

    const [result] = await pool.query(
      `INSERT INTO users (employee_code, full_name, email, password_hash, phone, department_id, avatar_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.employee_code, data.full_name, data.email, hash, data.phone || null, data.department_id || null, data.avatar_url || null, data.status || 'active']
    );

    // Assign roles if provided
    if (data.role_ids && data.role_ids.length > 0) {
      for (const roleId of data.role_ids) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [result.insertId, roleId]);
      }
    }

    return this.getById(result.insertId);
  }

  async update(id, data) {
    const user = await this.getById(id);

    if (data.email && data.email !== user.email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [data.email, id]);
      if (existing.length > 0) {
        throw { statusCode: HTTP_STATUS.CONFLICT, message: 'Email already in use.' };
      }
    }

    const fields = [];
    const values = [];

    const updatableFields = ['full_name', 'email', 'phone', 'department_id', 'avatar_url', 'status', 'employee_code'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(data.password, salt);
      fields.push('password_hash = ?');
      values.push(hash);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // Update roles if provided
    if (data.role_ids) {
      await pool.query('DELETE FROM user_roles WHERE user_id = ?', [id]);
      for (const roleId of data.role_ids) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, roleId]);
      }
    }

    return this.getById(id);
  }

  async delete(id) {
    const user = await this.getById(id);
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return { message: 'User deleted successfully.' };
  }

  async getRoles() {
    const [roles] = await pool.query(
      `SELECT r.*, GROUP_CONCAT(p.permission_code) as permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       GROUP BY r.id
       ORDER BY r.role_name`
    );
    return roles;
  }

  async getPermissions() {
    const [permissions] = await pool.query('SELECT * FROM permissions ORDER BY permission_name');
    return permissions;
  }

  async createRole(data, permissionIds) {
    const [result] = await pool.query(
      'INSERT INTO roles (role_name, description) VALUES (?, ?)',
      [data.role_name, data.description || null]
    );

    if (permissionIds && permissionIds.length > 0) {
      for (const permId of permissionIds) {
        await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [result.insertId, permId]);
      }
    }

    return this.getRoles();
  }

  async updateRole(id, data, permissionIds) {
    const fields = [];
    const values = [];
    if (data.role_name) { fields.push('role_name = ?'); values.push(data.role_name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (permissionIds) {
      await pool.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      for (const permId of permissionIds) {
        await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [id, permId]);
      }
    }

    return this.getRoles();
  }

  async deleteRole(id) {
    await pool.query('DELETE FROM roles WHERE id = ?', [id]);
    return { message: 'Role deleted successfully.' };
  }

  async getDepartments() {
    const [departments] = await pool.query('SELECT * FROM departments ORDER BY department_name');
    return departments;
  }

  async createDepartment(data) {
    const [result] = await pool.query(
      'INSERT INTO departments (department_name) VALUES (?)',
      [data.department_name]
    );
    const [dept] = await pool.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    return dept[0];
  }

  async updateDepartment(id, data) {
    await pool.query('UPDATE departments SET department_name = ? WHERE id = ?', [data.department_name, id]);
    const [dept] = await pool.query('SELECT * FROM departments WHERE id = ?', [id]);
    return dept[0];
  }

  async deleteDepartment(id) {
    await pool.query('DELETE FROM departments WHERE id = ?', [id]);
    return { message: 'Department deleted successfully.' };
  }
}

module.exports = new UserService();