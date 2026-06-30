require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/database');
const logger = require('./utils/logger');

async function seed() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting database seed...');
    await connection.beginTransaction();

    // 1. Insert Departments
    const depts = [
      'Information Technology', 'Human Resources', 'Finance', 'Marketing',
      'Operations', 'Engineering', 'Sales', 'Legal', 'Administration'
    ];
    for (const name of depts) {
      await connection.query('INSERT IGNORE INTO departments (department_name) VALUES (?)', [name]);
    }

    // 2. Insert Roles (including inventory_officer)
    const roles = ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee', 'inventory_officer'];
    for (const role of roles) {
      await connection.query(
        'INSERT IGNORE INTO roles (role_name, description) VALUES (?, ?)',
        [role, `Role: ${role.replace('_', ' ')}`]
      );
    }

    // 3. Insert Permissions
    const permissions = [
      ['users.view', 'View Users'],
      ['users.create', 'Create Users'],
      ['users.edit', 'Edit Users'],
      ['users.delete', 'Delete Users'],
      ['roles.view', 'View Roles'],
      ['roles.create', 'Create Roles'],
      ['roles.edit', 'Edit Roles'],
      ['roles.delete', 'Delete Roles'],
      ['assets.view', 'View Assets'],
      ['assets.create', 'Create Assets'],
      ['assets.edit', 'Edit Assets'],
      ['assets.delete', 'Delete Assets'],
      ['borrow.view', 'View Borrow Requests'],
      ['borrow.create', 'Create Borrow Requests'],
      ['borrow.approve', 'Approve Borrow Requests'],
      ['borrow.confirm', 'Confirm Borrow'],
      ['borrow.return', 'Process Returns'],
      ['repair.view', 'View Repair Requests'],
      ['repair.create', 'Create Repair Requests'],
      ['repair.update_status', 'Update Repair Status'],
      ['repair.close', 'Close Repairs'],
      ['parts.view', 'View Spare Parts'],
      ['parts.create', 'Create Spare Parts'],
      ['parts.edit', 'Edit Spare Parts'],
      ['parts.manage', 'Manage Parts Stock'],
      ['dashboard.view', 'View Dashboard'],
      ['reports.view', 'View Reports'],
      ['departments.view', 'View Departments'],
      ['departments.manage', 'Manage Departments'],
    ];
    for (const [code, name] of permissions) {
      await connection.query(
        'INSERT IGNORE INTO permissions (permission_code, permission_name) VALUES (?, ?)',
        [code, name]
      );
    }

    // 4. Assign all permissions to super_admin role
    const [roleRows] = await connection.query('SELECT id FROM roles WHERE role_name = ?', ['super_admin']);
    const [permRows] = await connection.query('SELECT id FROM permissions');
    if (roleRows.length > 0) {
      const superAdminRoleId = roleRows[0].id;
      for (const perm of permRows) {
        await connection.query(
          'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [superAdminRoleId, perm.id]
        );
      }
    }

    // 5. Assign permissions to it_admin
    const [itAdminRole] = await connection.query('SELECT id FROM roles WHERE role_name = ?', ['it_admin']);
    if (itAdminRole.length > 0) {
      const roleId = itAdminRole[0].id;
      const itAdminPerms = ['assets.view','assets.create','assets.edit','assets.delete','borrow.view','borrow.approve','borrow.confirm','borrow.return','repair.view','repair.update_status','repair.close','parts.view','parts.create','parts.edit','parts.manage','dashboard.view','reports.view','users.view','departments.view'];
      for (const code of itAdminPerms) {
        const [p] = await connection.query('SELECT id FROM permissions WHERE permission_code = ?', [code]);
        if (p.length > 0) {
          await connection.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, p[0].id]);
        }
      }
    }

    // 6. Assign permissions to approver
    const [approverRole] = await connection.query('SELECT id FROM roles WHERE role_name = ?', ['approver']);
    if (approverRole.length > 0) {
      const roleId = approverRole[0].id;
      const approverPerms = ['borrow.view','borrow.approve','dashboard.view','assets.view'];
      for (const code of approverPerms) {
        const [p] = await connection.query('SELECT id FROM permissions WHERE permission_code = ?', [code]);
        if (p.length > 0) {
          await connection.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, p[0].id]);
        }
      }
    }

    // 7. Assign permissions to it_technician
    const [techRole] = await connection.query('SELECT id FROM roles WHERE role_name = ?', ['it_technician']);
    if (techRole.length > 0) {
      const roleId = techRole[0].id;
      const techPerms = ['repair.view','repair.update_status','repair.close','assets.view','parts.view','parts.create','parts.edit','dashboard.view'];
      for (const code of techPerms) {
        const [p] = await connection.query('SELECT id FROM permissions WHERE permission_code = ?', [code]);
        if (p.length > 0) {
          await connection.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, p[0].id]);
        }
      }
    }

    // 7b. Assign permissions to inventory_officer
    const [invRole] = await connection.query('SELECT id FROM roles WHERE role_name = ?', ['inventory_officer']);
    if (invRole.length > 0) {
      const roleId = invRole[0].id;
      const invPerms = ['parts.view','parts.create','parts.edit','parts.manage','assets.view','dashboard.view','reports.view'];
      for (const code of invPerms) {
        const [p] = await connection.query('SELECT id FROM permissions WHERE permission_code = ?', [code]);
        if (p.length > 0) {
          await connection.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, p[0].id]);
        }
      }
    }

    // 8. Assign permissions to employee
    const [empRole] = await connection.query('SELECT id FROM roles WHERE role_name = ?', ['employee']);
    if (empRole.length > 0) {
      const roleId = empRole[0].id;
      const empPerms = ['borrow.view','borrow.create','repair.view','repair.create','assets.view','dashboard.view'];
      for (const code of empPerms) {
        const [p] = await connection.query('SELECT id FROM permissions WHERE permission_code = ?', [code]);
        if (p.length > 0) {
          await connection.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, p[0].id]);
        }
      }
    }

    // 9. Create admin users
    const [itDept] = await connection.query('SELECT id FROM departments WHERE department_name = ?', ['Information Technology']);
    const itDeptId = itDept.length > 0 ? itDept[0].id : 1;

    const adminUsers = [
      { code: 'SA001', name: 'Super Admin', email: 'superadmin@company.com', password: 'admin123', dept: null },
      { code: 'IT001', name: 'John Doe', email: 'itadmin@company.com', password: 'admin123', dept: itDeptId },
      { code: 'IT002', name: 'Jane Smith', email: 'tech@company.com', password: 'admin123', dept: itDeptId },
      { code: 'EMP001', name: 'Alice Johnson', email: 'approver@company.com', password: 'admin123', dept: itDeptId },
      { code: 'EMP002', name: 'Bob Williams', email: 'employee@company.com', password: 'admin123', dept: itDeptId },
      { code: 'INV001', name: 'Carol Davis', email: 'inventory@company.com', password: 'admin123', dept: itDeptId },
    ];

    const userRoles = ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee', 'inventory_officer'];

    for (let i = 0; i < adminUsers.length; i++) {
      const u = adminUsers[i];
      const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(u.password, salt);
        const [result] = await connection.query(
          'INSERT INTO users (employee_code, full_name, email, password_hash, department_id) VALUES (?, ?, ?, ?, ?)',
          [u.code, u.name, u.email, hash, u.dept]
        );

        const [roleRow] = await connection.query('SELECT id FROM roles WHERE role_name = ?', [userRoles[i]]);
        if (roleRow.length > 0) {
          await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [result.insertId, roleRow[0].id]);
        }
      }
    }

    // 10. Create asset categories
    const categories = [
      'Laptop', 'Desktop', 'Monitor', 'Printer', 'Server', 'Network Equipment',
      'Tablet', 'Mobile Phone', 'Keyboard', 'Mouse', 'Headset', 'Projector',
      'UPS', 'Scanner', 'Camera', 'Other',
    ];
    for (const cat of categories) {
      await connection.query('INSERT IGNORE INTO asset_categories (category_name) VALUES (?)', [cat]);
    }

    // 11. Create locations
    const locations = [
      { name: 'Main Office - Floor 1', building: 'HQ', floor: '1', room: '101' },
      { name: 'Main Office - Floor 2', building: 'HQ', floor: '2', room: '201' },
      { name: 'IT Server Room', building: 'HQ', floor: 'B1', room: 'B01' },
      { name: 'Warehouse', building: 'Warehouse A', floor: '1', room: 'W01' },
    ];
    for (const loc of locations) {
      await connection.query(
        'INSERT IGNORE INTO locations (location_name, building, floor, room) VALUES (?, ?, ?, ?)',
        [loc.name, loc.building, loc.floor, loc.room]
      );
    }

    // 12. Create sample assets
    const [catRows] = await connection.query('SELECT id, category_name FROM asset_categories');
    const [locRows] = await connection.query('SELECT id, location_name FROM locations');
    const catMap = {};
    catRows.forEach(c => { catMap[c.category_name] = c.id; });
    const locMap = {};
    locRows.forEach(l => { locMap[l.location_name] = l.id; });

    const assets = [
      { code: 'LAP-001', name: 'Dell Latitude 5440', cat: 'Laptop', brand: 'Dell', model: 'Latitude 5440', sn: 'SN-DELL-001', loc: 1, status: 'available', cond: 'good', warranty: '2027-06-30' },
      { code: 'LAP-002', name: 'HP EliteBook 840', cat: 'Laptop', brand: 'HP', model: 'EliteBook 840 G10', sn: 'SN-HP-001', loc: 1, status: 'available', cond: 'good', warranty: '2027-03-15' },
      { code: 'LAP-003', name: 'Lenovo ThinkPad X1', cat: 'Laptop', brand: 'Lenovo', model: 'ThinkPad X1 Carbon', sn: 'SN-LEN-001', loc: 2, status: 'available', cond: 'new', warranty: '2026-12-31' },
      { code: 'MON-001', name: 'Dell 27" Monitor', cat: 'Monitor', brand: 'Dell', model: 'U2723QE', sn: 'SN-MON-001', loc: 1, status: 'available', cond: 'good', warranty: '2026-08-15' },
      { code: 'MON-002', name: 'LG 24" Monitor', cat: 'Monitor', brand: 'LG', model: '24MK600M', sn: 'SN-MON-002', loc: 2, status: 'available', cond: 'fair', warranty: '2025-11-30' },
      { code: 'PRN-001', name: 'HP LaserJet Pro', cat: 'Printer', brand: 'HP', model: 'LaserJet Pro M404dn', sn: 'SN-PRN-001', loc: 3, status: 'available', cond: 'good', warranty: '2026-05-20' },
      { code: 'SRV-001', name: 'Dell PowerEdge R740', cat: 'Server', brand: 'Dell', model: 'PowerEdge R740', sn: 'SN-SRV-001', loc: 3, status: 'available', cond: 'good', warranty: '2027-01-10' },
      { code: 'NET-001', name: 'Cisco Switch 2960', cat: 'Network Equipment', brand: 'Cisco', model: 'Catalyst 2960-X', sn: 'SN-NET-001', loc: 3, status: 'available', cond: 'good', warranty: '2026-10-01' },
      { code: 'TAB-001', name: 'iPad Pro 12.9"', cat: 'Tablet', brand: 'Apple', model: 'iPad Pro 6th Gen', sn: 'SN-TAB-001', loc: 1, status: 'available', cond: 'new', warranty: '2027-09-15' },
      { code: 'PHN-001', name: 'iPhone 15 Pro', cat: 'Mobile Phone', brand: 'Apple', model: 'iPhone 15 Pro', sn: 'SN-PHN-001', loc: 2, status: 'available', cond: 'new', warranty: '2026-08-31' },
    ];

    for (const asset of assets) {
      const [existing] = await connection.query('SELECT id FROM assets WHERE asset_code = ?', [asset.code]);
      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO assets (asset_code, asset_name, category_id, brand, model, serial_number, location_id, asset_status, condition_status, purchase_date, warranty_end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365) DAY), ?)`,
          [asset.code, asset.name, catMap[asset.cat] || 1, asset.brand, asset.model, asset.sn, asset.loc, asset.status, asset.cond, asset.warranty]
        );
      }
    }

    await connection.commit();
    console.log('Database seeded successfully!');
    console.log('---');
    console.log('Test accounts:');
    console.log('  superadmin@company.com / admin123 (Super Admin)');
    console.log('  itadmin@company.com / admin123 (IT Admin)');
    console.log('  tech@company.com / admin123 (IT Technician)');
    console.log('  approver@company.com / admin123 (Approver)');
    console.log('  employee@company.com / admin123 (Employee)');
    console.log('  inventory@company.com / admin123 (Inventory Officer)');
    console.log('---');

    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('Seed failed:', error.message);
    logger.error('Seed failed', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    connection.release();
  }
}

seed();