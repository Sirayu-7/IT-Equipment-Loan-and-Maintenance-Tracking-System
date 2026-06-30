const pool = require('../config/database');
const { HTTP_STATUS, PART_STATUS, RESERVATION_STATUS, TRANSACTION_TYPE } = require('../utils/constants');

class PartService {
  // ==================== PARTS MASTER ====================

  async getAllParts({ page = 1, limit = 20, search, category_id, status, supplier_id, sort_by = 'part_code', sort_order = 'ASC' }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (p.part_code LIKE ? OR p.part_name LIKE ? OR p.brand LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category_id) { where += ' AND p.category_id = ?'; params.push(category_id); }
    if (status) { where += ' AND p.status = ?'; params.push(status); }
    if (supplier_id) { where += ' AND p.supplier_id = ?'; params.push(supplier_id); }

    const allowedSort = ['part_code', 'part_name', 'current_stock', 'status', 'cost_price'];
    const orderCol = allowedSort.includes(sort_by) ? sort_by : 'part_code';
    const orderDir = sort_order === 'DESC' ? 'DESC' : 'ASC';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM parts p ${where}`, params
    );

    const [parts] = await pool.query(
      `SELECT p.*, pc.category_name, s.supplier_name, pl.location_name
       FROM parts p
       LEFT JOIN part_categories pc ON p.category_id = pc.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN part_locations pl ON p.location_id = pl.id
       ${where}
       ORDER BY p.${orderCol} ${orderDir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      parts,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  async getPartById(id) {
    const [parts] = await pool.query(
      `SELECT p.*, pc.category_name, s.supplier_name, pl.location_name
       FROM parts p
       LEFT JOIN part_categories pc ON p.category_id = pc.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN part_locations pl ON p.location_id = pl.id
       WHERE p.id = ?`, [id]
    );
    if (parts.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Part not found.' };
    }

    // Get stock by location
    const [stocks] = await pool.query(
      `SELECT ps.*, pl.location_name
       FROM part_stocks ps
       JOIN part_locations pl ON ps.location_id = pl.id
       WHERE ps.part_id = ?`, [id]
    );

    // Get recent transactions
    const [transactions] = await pool.query(
      `SELECT pt.*, u.full_name as performed_by_name
       FROM part_transactions pt
       LEFT JOIN users u ON pt.performed_by = u.id
       WHERE pt.part_id = ?
       ORDER BY pt.performed_at DESC
       LIMIT 20`, [id]
    );

    return { ...parts[0], stocks, transactions };
  }

  async createPart(data, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query('SELECT id FROM parts WHERE part_code = ?', [data.part_code]);
      if (existing.length > 0) {
        throw { statusCode: HTTP_STATUS.CONFLICT, message: 'Part code already exists.' };
      }

      const [result] = await connection.query(
        `INSERT INTO parts (part_code, part_name, category_id, unit, brand, model, supplier_id,
          min_stock, max_stock, current_stock, reserved_stock, cost_price, location_id, shelf_location, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.part_code, data.part_name, data.category_id || null, data.unit || 'piece',
         data.brand || null, data.model || null, data.supplier_id || null,
         data.min_stock || 0, data.max_stock || 0, data.current_stock || 0, 0,
         data.cost_price || null, data.location_id || null, data.shelf_location || null,
         data.current_stock > 0 ? PART_STATUS.IN_STOCK : PART_STATUS.OUT_OF_STOCK, data.notes || null]
      );

      // Create initial stock record
      if (data.current_stock > 0) {
        await connection.query(
          `INSERT INTO part_stocks (part_id, location_id, current_stock, reserved_stock)
           VALUES (?, ?, ?, 0)`,
          [result.insertId, data.location_id || 1, data.current_stock]
        );

        await connection.query(
          `INSERT INTO part_transactions (part_id, transaction_type, qty, stock_before, stock_after, reference_type, performed_by, remark)
           VALUES (?, ?, ?, 0, ?, 'initial', ?, 'Initial stock entry')`,
          [result.insertId, TRANSACTION_TYPE.INITIAL_BALANCE, data.current_stock, data.current_stock, userId]
        );
      }

      await connection.commit();
      return this.getPartById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updatePart(id, data, userId) {
    const part = await this.getPartById(id);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE parts SET
          part_name = ?, category_id = ?, unit = ?, brand = ?, model = ?,
          supplier_id = ?, min_stock = ?, max_stock = ?, cost_price = ?,
          location_id = ?, shelf_location = ?, notes = ?
         WHERE id = ?`,
        [data.part_name || part.part_name, data.category_id || part.category_id,
         data.unit || part.unit, data.brand || part.brand, data.model || part.model,
         data.supplier_id || part.supplier_id, data.min_stock ?? part.min_stock,
         data.max_stock ?? part.max_stock, data.cost_price ?? part.cost_price,
         data.location_id || part.location_id, data.shelf_location || part.shelf_location,
         data.notes ?? part.notes, id]
      );

      // Update status based on stock levels
      await this._updatePartStatus(connection, id);

      await connection.commit();
      return this.getPartById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==================== STOCK MANAGEMENT ====================

  async adjustStock(id, data, userId) {
    const part = await this.getPartById(id);
    const { adjustment_type, qty, reason } = data;

    if (qty <= 0) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Quantity must be positive.' };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const currentStock = part.current_stock;
      let newStock = currentStock;
      let transactionType;

      if (adjustment_type === 'add') {
        newStock = currentStock + qty;
        transactionType = TRANSACTION_TYPE.ADJUSTMENT_IN;
      } else if (adjustment_type === 'remove') {
        if (currentStock - part.reserved_stock < qty) {
          throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: `Insufficient available stock. Available: ${currentStock - part.reserved_stock}` };
        }
        newStock = currentStock - qty;
        transactionType = TRANSACTION_TYPE.ADJUSTMENT_OUT;
      } else {
        throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Invalid adjustment type. Use "add" or "remove".' };
      }

      await connection.query('UPDATE parts SET current_stock = ? WHERE id = ?', [newStock, id]);

      // Update part_stocks
      const locationId = data.location_id || part.location_id || 1;
      const [existingStock] = await connection.query(
        'SELECT id FROM part_stocks WHERE part_id = ? AND location_id = ?', [id, locationId]
      );
      if (existingStock.length > 0) {
        await connection.query(
          'UPDATE part_stocks SET current_stock = ? WHERE part_id = ? AND location_id = ?',
          [newStock, id, locationId]
        );
      } else {
        await connection.query(
          'INSERT INTO part_stocks (part_id, location_id, current_stock, reserved_stock) VALUES (?, ?, ?, 0)',
          [id, locationId, newStock]
        );
      }

      // Record transaction
      await connection.query(
        `INSERT INTO part_transactions (part_id, transaction_type, qty, stock_before, stock_after, reference_type, performed_by, remark)
         VALUES (?, ?, ?, ?, ?, 'stock_adjustment', ?, ?)`,
        [id, transactionType, qty, currentStock, newStock, userId, reason || `Stock ${adjustment_type} adjustment`]
      );

      // Update part status
      await this._updatePartStatus(connection, id);

      await connection.commit();
      return this.getPartById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async _updatePartStatus(connection, partId) {
    const [parts] = await connection.query(
      'SELECT current_stock, min_stock, status FROM parts WHERE id = ?', [partId]
    );
    if (parts.length === 0) return;

    const p = parts[0];
    let newStatus = p.status;

    if (p.current_stock <= 0) {
      newStatus = PART_STATUS.OUT_OF_STOCK;
    } else if (p.min_stock > 0 && p.current_stock <= p.min_stock) {
      newStatus = PART_STATUS.LOW_STOCK;
    } else {
      newStatus = PART_STATUS.IN_STOCK;
    }

    if (newStatus !== p.status) {
      await connection.query('UPDATE parts SET status = ? WHERE id = ?', [newStatus, partId]);
    }
  }

  // ==================== RESERVATIONS ====================

  async reservePart(data, userId) {
    const { repair_request_id, part_id, qty, notes } = data;

    if (qty <= 0) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Quantity must be positive.' };
    }

    const [parts] = await pool.query('SELECT * FROM parts WHERE id = ?', [part_id]);
    if (parts.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Part not found.' };
    }

    const part = parts[0];
    const availableStock = part.current_stock - part.reserved_stock;

    if (availableStock < qty) {
      throw {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Insufficient available stock. Required: ${qty}, Available: ${availableStock}`,
      };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create reservation
      const [result] = await connection.query(
        `INSERT INTO part_reservations (repair_request_id, part_id, qty_reserved, reserved_by, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [repair_request_id, part_id, qty, userId, notes || null]
      );

      // Update reserved stock
      await connection.query(
        'UPDATE parts SET reserved_stock = reserved_stock + ? WHERE id = ?',
        [qty, part_id]
      );

      // Update part_stocks
      await connection.query(
        'UPDATE part_stocks SET reserved_stock = reserved_stock + ? WHERE part_id = ?',
        [qty, part_id]
      );

      // Record transaction
      await connection.query(
        `INSERT INTO part_transactions (part_id, transaction_type, qty, stock_before, stock_after, reference_type, reference_id, performed_by, remark)
         VALUES (?, ?, ?, ?, ?, 'repair_request', ?, ?, ?)`,
        [part_id, TRANSACTION_TYPE.RESERVATION, qty, part.reserved_stock, part.reserved_stock + qty,
         repair_request_id, userId, notes || `Reserved for repair #${repair_request_id}`]
      );

      await connection.commit();
      return this.getReservationById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async cancelReservation(id, userId) {
    const [reservations] = await pool.query(
      `SELECT pr.*, p.current_stock, p.reserved_stock as part_reserved
       FROM part_reservations pr
       JOIN parts p ON pr.part_id = p.id
       WHERE pr.id = ?`, [id]
    );

    if (reservations.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Reservation not found.' };
    }

    const reservation = reservations[0];
    if (reservation.status === RESERVATION_STATUS.CANCELLED) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Reservation already cancelled.' };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const qtyToRelease = reservation.qty_reserved - (reservation.qty_used || 0);

      // Update reservation status
      await connection.query(
        'UPDATE part_reservations SET status = ? WHERE id = ?',
        [RESERVATION_STATUS.CANCELLED, id]
      );

      // Release reserved stock
      if (qtyToRelease > 0) {
        await connection.query(
          'UPDATE parts SET reserved_stock = GREATEST(reserved_stock - ?, 0) WHERE id = ?',
          [qtyToRelease, reservation.part_id]
        );
        await connection.query(
          'UPDATE part_stocks SET reserved_stock = GREATEST(reserved_stock - ?, 0) WHERE part_id = ?',
          [qtyToRelease, reservation.part_id]
        );
      }

      // Record transaction
      await connection.query(
        `INSERT INTO part_transactions (part_id, transaction_type, qty, stock_before, stock_after, reference_type, reference_id, performed_by, remark)
         VALUES (?, ?, ?, ?, ?, 'repair_request', ?, ?, ?)`,
        [reservation.part_id, TRANSACTION_TYPE.RESERVATION_CANCELLED, qtyToRelease,
         reservation.part_reserved, Math.max(reservation.part_reserved - qtyToRelease, 0),
         reservation.repair_request_id, userId, 'Reservation cancelled']
      );

      await connection.commit();
      return this.getReservationById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getReservationById(id) {
    const [reservations] = await pool.query(
      `SELECT pr.*, p.part_code, p.part_name, p.unit, u.full_name as reserved_by_name,
              rr.repair_no
       FROM part_reservations pr
       JOIN parts p ON pr.part_id = p.id
       LEFT JOIN users u ON pr.reserved_by = u.id
       LEFT JOIN repair_requests rr ON pr.repair_request_id = rr.id
       WHERE pr.id = ?`, [id]
    );
    if (reservations.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Reservation not found.' };
    }
    return reservations[0];
  }

  async getReservationsByRepair(repairRequestId) {
    const [reservations] = await pool.query(
      `SELECT pr.*, p.part_code, p.part_name, p.unit, p.current_stock, p.reserved_stock,
              u.full_name as reserved_by_name
       FROM part_reservations pr
       JOIN parts p ON pr.part_id = p.id
       LEFT JOIN users u ON pr.reserved_by = u.id
       WHERE pr.repair_request_id = ?
       ORDER BY pr.created_at DESC`, [repairRequestId]
    );
    return reservations;
  }

  // ==================== CONSUMPTIONS ====================

  async consumePart(data, userId) {
    const { repair_request_id, part_id, reservation_id, qty, notes } = data;

    if (qty <= 0) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Quantity must be positive.' };
    }

    const [parts] = await pool.query('SELECT * FROM parts WHERE id = ?', [part_id]);
    if (parts.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Part not found.' };
    }

    const part = parts[0];
    const availableStock = part.current_stock - part.reserved_stock;

    if (availableStock < qty) {
      throw {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Insufficient available stock. Required: ${qty}, Available: ${availableStock}`,
      };
    }

    // If reservation_id provided, validate it
    let reservation = null;
    if (reservation_id) {
      const [reservations] = await pool.query(
        'SELECT * FROM part_reservations WHERE id = ? AND part_id = ?',
        [reservation_id, part_id]
      );
      if (reservations.length === 0) {
        throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Reservation not found for this part.' };
      }
      reservation = reservations[0];
      const remainingReserved = reservation.qty_reserved - (reservation.qty_used || 0);
      if (qty > remainingReserved) {
        throw {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: `Cannot consume more than reserved. Remaining reserved: ${remainingReserved}`,
        };
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create consumption record
      const [result] = await connection.query(
        `INSERT INTO part_consumptions (repair_request_id, part_id, reservation_id, qty_used, consumed_by, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [repair_request_id, part_id, reservation_id || null, qty, userId, notes || null]
      );

      // Deduct from current stock
      await connection.query(
        'UPDATE parts SET current_stock = current_stock - ?, reserved_stock = GREATEST(reserved_stock - ?, 0) WHERE id = ?',
        [qty, qty, part_id]
      );

      // Update part_stocks
      await connection.query(
        'UPDATE part_stocks SET current_stock = current_stock - ?, reserved_stock = GREATEST(reserved_stock - ?, 0) WHERE part_id = ?',
        [qty, qty, part_id]
      );

      // Update reservation if exists
      if (reservation) {
        const newQtyUsed = (reservation.qty_used || 0) + qty;
        let resStatus = reservation.status;
        if (newQtyUsed >= reservation.qty_reserved) {
          resStatus = RESERVATION_STATUS.ISSUED;
        } else {
          resStatus = RESERVATION_STATUS.PARTIALLY_ISSUED;
        }
        await connection.query(
          'UPDATE part_reservations SET qty_used = ?, status = ? WHERE id = ?',
          [newQtyUsed, resStatus, reservation_id]
        );
      }

      // Record transaction
      await connection.query(
        `INSERT INTO part_transactions (part_id, transaction_type, qty, stock_before, stock_after, reference_type, reference_id, performed_by, remark)
         VALUES (?, ?, ?, ?, ?, 'repair_request', ?, ?, ?)`,
        [part_id, TRANSACTION_TYPE.CONSUMPTION_OUT, qty, part.current_stock, part.current_stock - qty,
         repair_request_id, userId, notes || `Consumed for repair #${repair_request_id}`]
      );

      // Update part status
      await this._updatePartStatus(connection, part_id);

      await connection.commit();
      return this.getConsumptionById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getConsumptionById(id) {
    const [consumptions] = await pool.query(
      `SELECT pc.*, p.part_code, p.part_name, p.unit, u.full_name as consumed_by_name,
              rr.repair_no
       FROM part_consumptions pc
       JOIN parts p ON pc.part_id = p.id
       LEFT JOIN users u ON pc.consumed_by = u.id
       LEFT JOIN repair_requests rr ON pc.repair_request_id = rr.id
       WHERE pc.id = ?`, [id]
    );
    if (consumptions.length === 0) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Consumption not found.' };
    }
    return consumptions[0];
  }

  async getConsumptionsByRepair(repairRequestId) {
    const [consumptions] = await pool.query(
      `SELECT pc.*, p.part_code, p.part_name, p.unit, u.full_name as consumed_by_name
       FROM part_consumptions pc
       JOIN parts p ON pc.part_id = p.id
       LEFT JOIN users u ON pc.consumed_by = u.id
       WHERE pc.repair_request_id = ?
       ORDER BY pc.consumed_at DESC`, [repairRequestId]
    );
    return consumptions;
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions({ page = 1, limit = 20, part_id, transaction_type, date_from, date_to }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (part_id) { where += ' AND pt.part_id = ?'; params.push(part_id); }
    if (transaction_type) { where += ' AND pt.transaction_type = ?'; params.push(transaction_type); }
    if (date_from) { where += ' AND pt.performed_at >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND pt.performed_at <= ?'; params.push(date_to); }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM part_transactions pt ${where}`, params
    );

    const [transactions] = await pool.query(
      `SELECT pt.*, p.part_code, p.part_name, u.full_name as performed_by_name
       FROM part_transactions pt
       JOIN parts p ON pt.part_id = p.id
       LEFT JOIN users u ON pt.performed_by = u.id
       ${where}
       ORDER BY pt.performed_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      transactions,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  // ==================== STOCK ALERTS ====================

  async getStockAlerts() {
    const [lowStock] = await pool.query(
      `SELECT p.*, pc.category_name, s.supplier_name
       FROM parts p
       LEFT JOIN part_categories pc ON p.category_id = pc.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.status IN ('low_stock', 'out_of_stock')
         AND p.status != 'discontinued'
       ORDER BY p.current_stock ASC`
    );

    const [reorderNeeded] = await pool.query(
      `SELECT p.*, pc.category_name, s.supplier_name,
              (p.min_stock - p.current_stock) as reorder_qty
       FROM parts p
       LEFT JOIN part_categories pc ON p.category_id = pc.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.current_stock <= p.min_stock
         AND p.min_stock > 0
         AND p.status != 'discontinued'
       ORDER BY (p.min_stock - p.current_stock) DESC`
    );

    return { lowStock, reorderNeeded };
  }

  // ==================== CATEGORIES, LOCATIONS, SUPPLIERS ====================

  async getCategories() {
    const [rows] = await pool.query('SELECT * FROM part_categories ORDER BY category_name');
    return rows;
  }

  async createCategory(data) {
    const [result] = await pool.query(
      'INSERT INTO part_categories (category_name, description) VALUES (?, ?)',
      [data.category_name, data.description || null]
    );
    return { id: result.insertId, ...data };
  }

  async getLocations() {
    const [rows] = await pool.query('SELECT * FROM part_locations ORDER BY location_name');
    return rows;
  }

  async createLocation(data) {
    const [result] = await pool.query(
      'INSERT INTO part_locations (location_name, description) VALUES (?, ?)',
      [data.location_name, data.description || null]
    );
    return { id: result.insertId, ...data };
  }

  async getSuppliers() {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY supplier_name');
    return rows;
  }

  async createSupplier(data) {
    const [result] = await pool.query(
      `INSERT INTO suppliers (supplier_name, contact_name, phone, email, address, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.supplier_name, data.contact_name || null, data.phone || null,
       data.email || null, data.address || null, data.notes || null]
    );
    return { id: result.insertId, ...data };
  }

  // ==================== REPORTS ====================

  async getInventoryReport() {
    const [summary] = await pool.query(`
      SELECT
        COUNT(*) as total_parts,
        SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock_count,
        SUM(CASE WHEN status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(current_stock) as total_current_stock,
        SUM(reserved_stock) as total_reserved_stock,
        SUM(current_stock - reserved_stock) as total_available_stock,
        SUM(CASE WHEN current_stock <= min_stock AND min_stock > 0 THEN 1 ELSE 0 END) as needs_reorder
      FROM parts
    `);

    const [byCategory] = await pool.query(`
      SELECT pc.category_name, COUNT(*) as part_count, SUM(p.current_stock) as total_stock
      FROM parts p
      LEFT JOIN part_categories pc ON p.category_id = pc.id
      GROUP BY pc.category_name
      ORDER BY part_count DESC
    `);

    return { summary: summary[0], byCategory };
  }

  async getRepairPartsReport({ date_from, date_to }) {
    let where = 'WHERE 1=1';
    const params = [];
    if (date_from) { where += ' AND pc.consumed_at >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND pc.consumed_at <= ?'; params.push(date_to); }

    const [consumptions] = await pool.query(`
      SELECT p.part_code, p.part_name, p.unit, SUM(pc.qty_used) as total_used,
             COUNT(DISTINCT pc.repair_request_id) as repair_count
      FROM part_consumptions pc
      JOIN parts p ON pc.part_id = p.id
      ${where}
      GROUP BY p.id, p.part_code, p.part_name, p.unit
      ORDER BY total_used DESC
      LIMIT 20
    `, params);

    return consumptions;
  }
}

module.exports = new PartService();