const pool = require('../config/database');
const { HTTP_STATUS, ASSET_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

class AssetService {
  async getAll({ page = 1, limit = 20, search, category_id, location_id, asset_status, condition_status, sort_by = 'created_at', sort_order = 'DESC' }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (a.asset_code LIKE ? OR a.asset_name LIKE ? OR a.serial_number LIKE ? OR a.asset_tag LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (category_id) {
      where += ' AND a.category_id = ?';
      params.push(category_id);
    }
    if (location_id) {
      where += ' AND a.location_id = ?';
      params.push(location_id);
    }
    if (asset_status) {
      where += ' AND a.asset_status = ?';
      params.push(asset_status);
    }
    if (condition_status) {
      where += ' AND a.condition_status = ?';
      params.push(condition_status);
    }

    const allowedSort = ['created_at', 'asset_name', 'asset_code', 'purchase_date', 'warranty_end_date', 'asset_status'];
    const orderCol = allowedSort.includes(sort_by) ? sort_by : 'created_at';
    const orderDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM assets a ${where}`, params
    );
    const total = countResult[0].total;

    const [assets] = await pool.query(
      `SELECT a.*, ac.category_name, l.location_name
       FROM assets a
       LEFT JOIN asset_categories ac ON a.category_id = ac.id
       LEFT JOIN locations l ON a.location_id = l.id
       ${where}
       ORDER BY a.${orderCol} ${orderDir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      assets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id) {
    const [assets] = await pool.query(
      `SELECT a.*, ac.category_name, l.location_name, l.building, l.floor, l.room
       FROM assets a
       LEFT JOIN asset_categories ac ON a.category_id = ac.id
       LEFT JOIN locations l ON a.location_id = l.id
       WHERE a.id = ?`,
      [id]
    );

    if (assets.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Asset not found.' };
    }

    // Get current borrow status
    const [activeBorrow] = await pool.query(
      `SELECT br.id, br.request_no, br.request_status, bri.item_status, bri.borrow_date, bri.due_date
       FROM borrow_request_items bri
       JOIN borrow_requests br ON bri.borrow_request_id = br.id
       WHERE bri.asset_id = ? AND bri.item_status IN ('pending','borrowed')
       LIMIT 1`,
      [id]
    );

    // Get repair history
    const [repairHistory] = await pool.query(
      `SELECT rr.id, rr.repair_no, rr.repair_status, rr.reported_at
       FROM repair_requests rr
       WHERE rr.asset_id = ?
       ORDER BY rr.reported_at DESC LIMIT 5`,
      [id]
    );

    return {
      ...assets[0],
      current_borrow: activeBorrow[0] || null,
      recent_repairs: repairHistory,
    };
  }

  async getByAssetCode(assetCode) {
    const [assets] = await pool.query(
      `SELECT a.*, ac.category_name, l.location_name
       FROM assets a
       LEFT JOIN asset_categories ac ON a.category_id = ac.id
       LEFT JOIN locations l ON a.location_id = l.id
       WHERE a.asset_code = ?`,
      [assetCode]
    );
    return assets[0] || null;
  }

  async create(data) {
    // Check duplicate asset code
    const existing = await this.getByAssetCode(data.asset_code);
    if (existing) {
      throw { statusCode: HTTP_STATUS.CONFLICT, message: 'Asset code already exists.' };
    }

    const [result] = await pool.query(
      `INSERT INTO assets (asset_code, asset_name, category_id, brand, model, serial_number, asset_tag, 
       location_id, condition_status, asset_status, purchase_date, warranty_end_date, price, photo_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.asset_code, data.asset_name, data.category_id || null,
        data.brand || null, data.model || null, data.serial_number || null,
        data.asset_tag || null, data.location_id || null,
        data.condition_status || 'good', data.asset_status || 'available',
        data.purchase_date || null, data.warranty_end_date || null,
        data.price || null, data.photo_url || null, data.notes || null,
      ]
    );

    // Log asset history
    await pool.query(
      `INSERT INTO asset_history (asset_id, action_type, action_by, remark) VALUES (?, 'created', ?, 'Asset created')`,
      [result.insertId, data.created_by || 1]
    );

    return this.getById(result.insertId);
  }

  async update(id, data) {
    const asset = await this.getById(id);

    if (data.asset_code && data.asset_code !== asset.asset_code) {
      const existing = await this.getByAssetCode(data.asset_code);
      if (existing) {
        throw { statusCode: HTTP_STATUS.CONFLICT, message: 'Asset code already exists.' };
      }
    }

    const fields = [];
    const values = [];

    const updatableFields = [
      'asset_name', 'category_id', 'brand', 'model', 'serial_number',
      'asset_tag', 'location_id', 'condition_status', 'asset_status',
      'purchase_date', 'warranty_end_date', 'price', 'photo_url', 'notes',
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) {
      return asset;
    }

    values.push(id);
    await pool.query(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`, values);

    // Log asset history
    await pool.query(
      `INSERT INTO asset_history (asset_id, action_type, action_by, remark) VALUES (?, 'updated', ?, 'Asset updated')`,
      [id, data.updated_by || 1]
    );

    return this.getById(id);
  }

  async delete(id) {
    const asset = await this.getById(id);

    // Check if asset is currently borrowed
    if (asset.asset_status === ASSET_STATUS.BORROWED) {
      throw { statusCode: HTTP_STATUS.CONFLICT, message: 'Cannot delete asset that is currently borrowed.' };
    }

    await pool.query('DELETE FROM assets WHERE id = ?', [id]);
    return { message: 'Asset deleted successfully.' };
  }

  async getCategories() {
    const [categories] = await pool.query(
      'SELECT id, category_name, description FROM asset_categories ORDER BY category_name'
    );
    return categories;
  }

  async createCategory(data) {
    const [result] = await pool.query(
      'INSERT INTO asset_categories (category_name, description) VALUES (?, ?)',
      [data.category_name, data.description || null]
    );
    const [categories] = await pool.query('SELECT * FROM asset_categories WHERE id = ?', [result.insertId]);
    return categories[0];
  }

  async getLocations() {
    const [locations] = await pool.query(
      'SELECT id, location_name, building, floor, room FROM locations ORDER BY location_name'
    );
    return locations;
  }

  async createLocation(data) {
    const [result] = await pool.query(
      'INSERT INTO locations (location_name, building, floor, room) VALUES (?, ?, ?, ?)',
      [data.location_name, data.building || null, data.floor || null, data.room || null]
    );
    const [locations] = await pool.query('SELECT * FROM locations WHERE id = ?', [result.insertId]);
    return locations[0];
  }

  async getHistory(assetId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM asset_history WHERE asset_id = ?',
      [assetId]
    );

    const [history] = await pool.query(
      `SELECT ah.*, u.full_name as action_by_name
       FROM asset_history ah
       LEFT JOIN users u ON ah.action_by = u.id
       WHERE ah.asset_id = ?
       ORDER BY ah.action_at DESC
       LIMIT ? OFFSET ?`,
      [assetId, parseInt(limit), parseInt(offset)]
    );

    return {
      history,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    };
  }
}

module.exports = new AssetService();