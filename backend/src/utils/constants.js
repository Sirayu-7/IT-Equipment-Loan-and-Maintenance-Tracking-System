// Asset Statuses
const ASSET_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  BORROWED: 'borrowed',
  UNDER_REPAIR: 'under_repair',
  PENDING_REPAIR: 'pending_repair',
  LOST: 'lost',
  DAMAGED: 'damaged',
  RETIRED: 'retired',
};

// Borrow Request Statuses
const BORROW_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  BORROWED: 'borrowed',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
};

// Borrow Item Statuses
const BORROW_ITEM_STATUS = {
  PENDING: 'pending',
  BORROWED: 'borrowed',
  RETURNED: 'returned',
  DAMAGED: 'damaged',
  LOST: 'lost',
};

// Repair Request Statuses (extended)
const REPAIR_STATUS = {
  REPORTED: 'reported',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  WAITING_PARTS: 'waiting_parts',
  PARTS_RESERVED: 'parts_reserved',
  PARTS_ISSUED: 'parts_issued',
  FIXED: 'fixed',
  CLOSED: 'closed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// User Statuses
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

// Condition Statuses
const CONDITION_STATUS = {
  NEW: 'new',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  DAMAGED: 'damaged',
};

// Priority Levels
const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Part Statuses
const PART_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued',
};

// Part Reservation Statuses
const RESERVATION_STATUS = {
  RESERVED: 'reserved',
  PARTIALLY_ISSUED: 'partially_issued',
  ISSUED: 'issued',
  CANCELLED: 'cancelled',
};

// Part Transaction Types
const TRANSACTION_TYPE = {
  PURCHASE_IN: 'purchase_in',
  RETURN_IN: 'return_in',
  ADJUSTMENT_IN: 'adjustment_in',
  ADJUSTMENT_OUT: 'adjustment_out',
  RESERVATION: 'reservation',
  RESERVATION_CANCELLED: 'reservation_cancelled',
  CONSUMPTION_OUT: 'consumption_out',
  TRANSFER_OUT: 'transfer_out',
  TRANSFER_IN: 'transfer_in',
  INITIAL_BALANCE: 'initial_balance',
};

// Roles
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  IT_ADMIN: 'it_admin',
  IT_TECHNICIAN: 'it_technician',
  APPROVER: 'approver',
  EMPLOYEE: 'employee',
  INVENTORY_OFFICER: 'inventory_officer',
};

// Response status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY: 429,
  INTERNAL_SERVER: 500,
};

// Notification channels
const NOTIFICATION_CHANNEL = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  BOTH: 'both',
};

module.exports = {
  ASSET_STATUS,
  BORROW_STATUS,
  BORROW_ITEM_STATUS,
  REPAIR_STATUS,
  USER_STATUS,
  CONDITION_STATUS,
  PRIORITY,
  PART_STATUS,
  RESERVATION_STATUS,
  TRANSACTION_TYPE,
  ROLES,
  HTTP_STATUS,
  NOTIFICATION_CHANNEL,
};
