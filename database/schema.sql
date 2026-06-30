-- IT Equipment Management System - Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS it_equipment_management;
USE it_equipment_management;

-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permission_code VARCHAR(100) NOT NULL UNIQUE,
  permission_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uk_role_permission (role_id, permission_id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department_id INT,
  avatar_url VARCHAR(255),
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB;

-- ============================================================
-- ASSETS & INVENTORY
-- ============================================================

CREATE TABLE asset_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_name VARCHAR(100) NOT NULL,
  building VARCHAR(100),
  floor VARCHAR(50),
  room VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_code VARCHAR(50) NOT NULL UNIQUE,
  asset_name VARCHAR(200) NOT NULL,
  category_id INT,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  asset_tag VARCHAR(100),
  location_id INT,
  condition_status ENUM('new','good','fair','poor','damaged') DEFAULT 'good',
  asset_status ENUM('available','reserved','borrowed','under_repair','pending_repair','lost','damaged','retired') DEFAULT 'available',
  purchase_date DATE,
  warranty_end_date DATE,
  price DECIMAL(12,2),
  photo_url VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- BORROW REQUESTS
-- ============================================================

CREATE TABLE borrow_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_no VARCHAR(30) NOT NULL UNIQUE,
  requester_id INT NOT NULL,
  approver_id INT,
  request_date DATE NOT NULL,
  purpose TEXT,
  needed_from DATE,
  needed_until DATE,
  request_status ENUM('draft','submitted','approved','rejected','borrowed','returned','cancelled') DEFAULT 'draft',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  notes TEXT,
  rejected_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE borrow_request_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  borrow_request_id INT NOT NULL,
  asset_id INT NOT NULL,
  qty INT DEFAULT 1,
  item_status ENUM('pending','borrowed','returned','damaged','lost') DEFAULT 'pending',
  borrow_date DATE,
  due_date DATE,
  returned_date DATE,
  return_condition VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (borrow_request_id) REFERENCES borrow_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
) ENGINE=InnoDB;

-- ============================================================
-- REPAIR REQUESTS
-- ============================================================

CREATE TABLE repair_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  repair_no VARCHAR(30) NOT NULL UNIQUE,
  requested_by INT NOT NULL,
  asset_id INT NOT NULL,
  issue_type VARCHAR(100),
  issue_detail TEXT,
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  repair_status ENUM('reported','accepted','in_progress','waiting_parts','parts_reserved','parts_issued','fixed','closed','rejected','cancelled') DEFAULT 'reported',
  assigned_to INT,
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  resolution_detail TEXT,
  cost_estimate DECIMAL(12,2),
  cost_actual DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE repair_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  repair_request_id INT NOT NULL,
  status_from VARCHAR(30),
  status_to VARCHAR(30) NOT NULL,
  action_by INT NOT NULL,
  action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comment TEXT,
  FOREIGN KEY (repair_request_id) REFERENCES repair_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  channel ENUM('in_app','email','both') DEFAULT 'in_app',
  reference_type VARCHAR(50),
  reference_id INT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- HISTORY & AUDIT
-- ============================================================

CREATE TABLE asset_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT,
  action_by INT NOT NULL,
  action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  remark TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_user_id INT,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- DASHBOARD CACHING
-- ============================================================

CREATE TABLE dashboard_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  scope_type ENUM('global','department','user') DEFAULT 'global',
  scope_id INT,
  total_assets INT DEFAULT 0,
  available_assets INT DEFAULT 0,
  borrowed_assets INT DEFAULT 0,
  under_repair_assets INT DEFAULT 0,
  overdue_borrows INT DEFAULT 0,
  open_repairs INT DEFAULT 0,
  completed_repairs_month INT DEFAULT 0,
  pending_approvals INT DEFAULT 0,
  active_users INT DEFAULT 0,
  warranty_expiring_soon INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_snapshot (snapshot_date, scope_type, scope_id)
) ENGINE=InnoDB;

CREATE TABLE dashboard_metrics_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_date DATE NOT NULL,
  scope_type ENUM('global','department','user') DEFAULT 'global',
  scope_id INT,
  metric_key VARCHAR(50) NOT NULL,
  metric_value DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_metric (metric_date, scope_type, scope_id, metric_key)
) ENGINE=InnoDB;

-- Indexes for performance
CREATE INDEX idx_assets_status ON assets(asset_status);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_borrow_requests_status ON borrow_requests(request_status);
CREATE INDEX idx_borrow_requests_requester ON borrow_requests(requester_id);
CREATE INDEX idx_borrow_items_asset ON borrow_request_items(asset_id);
CREATE INDEX idx_repair_requests_status ON repair_requests(repair_status);
CREATE INDEX idx_repair_requests_asset ON repair_requests(asset_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_asset_history_asset ON asset_history(asset_id);