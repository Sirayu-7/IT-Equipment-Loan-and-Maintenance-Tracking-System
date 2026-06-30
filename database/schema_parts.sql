-- ============================================================
-- SPARE PARTS INVENTORY MANAGEMENT - Additional Schema
-- ============================================================

-- Part Categories
CREATE TABLE IF NOT EXISTS part_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  notes TEXT,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Part Storage Locations
CREATE TABLE IF NOT EXISTS part_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Parts Master
CREATE TABLE IF NOT EXISTS parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  part_code VARCHAR(50) NOT NULL UNIQUE,
  part_name VARCHAR(200) NOT NULL,
  category_id INT,
  unit VARCHAR(30) DEFAULT 'piece',
  brand VARCHAR(100),
  model VARCHAR(100),
  supplier_id INT,
  min_stock INT DEFAULT 0,
  max_stock INT DEFAULT 0,
  current_stock INT DEFAULT 0,
  reserved_stock INT DEFAULT 0,
  available_stock INT GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
  cost_price DECIMAL(12,2),
  selling_price DECIMAL(12,2),
  location_id INT,
  shelf_location VARCHAR(100),
  status ENUM('in_stock','low_stock','out_of_stock','discontinued') DEFAULT 'in_stock',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES part_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES part_locations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Part Stock by Location (multi-location support)
CREATE TABLE IF NOT EXISTS part_stocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  part_id INT NOT NULL,
  location_id INT NOT NULL,
  current_stock INT DEFAULT 0,
  reserved_stock INT DEFAULT 0,
  available_stock INT GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES part_locations(id) ON DELETE CASCADE,
  UNIQUE KEY uk_part_location (part_id, location_id)
) ENGINE=InnoDB;

-- Part Reservations (linked to repair request)
CREATE TABLE IF NOT EXISTS part_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  repair_request_id INT NOT NULL,
  part_id INT NOT NULL,
  qty_reserved INT NOT NULL DEFAULT 1,
  qty_used INT DEFAULT 0,
  reserved_by INT NOT NULL,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('reserved','partially_issued','issued','cancelled') DEFAULT 'reserved',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (repair_request_id) REFERENCES repair_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES parts(id),
  FOREIGN KEY (reserved_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Part Consumptions (actual usage)
CREATE TABLE IF NOT EXISTS part_consumptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  repair_request_id INT NOT NULL,
  part_id INT NOT NULL,
  reservation_id INT,
  qty_used INT NOT NULL DEFAULT 1,
  consumed_by INT NOT NULL,
  consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repair_request_id) REFERENCES repair_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES parts(id),
  FOREIGN KEY (reservation_id) REFERENCES part_reservations(id) ON DELETE SET NULL,
  FOREIGN KEY (consumed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Part Transactions (audit trail for all stock movements)
CREATE TABLE IF NOT EXISTS part_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  part_id INT NOT NULL,
  transaction_type ENUM('purchase_in','return_in','adjustment_in','adjustment_out','reservation','reservation_cancelled','consumption_out','transfer_out','transfer_in','initial_balance') NOT NULL,
  qty INT NOT NULL,
  stock_before INT DEFAULT 0,
  stock_after INT DEFAULT 0,
  reference_type VARCHAR(50),
  reference_id INT,
  performed_by INT NOT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  remark TEXT,
  FOREIGN KEY (part_id) REFERENCES parts(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Status History (generic for any entity)
CREATE TABLE IF NOT EXISTS status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  remark TEXT,
  FOREIGN KEY (changed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- Indexes
CREATE INDEX idx_parts_code ON parts(part_code);
CREATE INDEX idx_parts_status ON parts(status);
CREATE INDEX idx_part_stocks_part ON part_stocks(part_id);
CREATE INDEX idx_part_reservations_repair ON part_reservations(repair_request_id);
CREATE INDEX idx_part_reservations_part ON part_reservations(part_id);
CREATE INDEX idx_part_consumptions_repair ON part_consumptions(repair_request_id);
CREATE INDEX idx_part_transactions_part ON part_transactions(part_id);
CREATE INDEX idx_part_transactions_type ON part_transactions(transaction_type);
CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id);