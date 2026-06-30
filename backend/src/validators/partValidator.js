const { body } = require('express-validator');

const createPartValidation = [
  body('part_code').notEmpty().withMessage('Part code is required'),
  body('part_name').notEmpty().withMessage('Part name is required'),
  body('unit').optional().isIn(['piece', 'box', 'set', 'meter', 'liter', 'kg']).withMessage('Invalid unit type'),
  body('category_id').optional({ nullable: true }).isInt().withMessage('Category must be an integer'),
  body('supplier_id').optional({ nullable: true }).isInt().withMessage('Supplier must be an integer'),
  body('location_id').optional({ nullable: true }).isInt().withMessage('Location must be an integer'),
  body('min_stock').optional().isInt({ min: 0 }).withMessage('Min stock must be a positive integer'),
  body('max_stock').optional().isInt({ min: 0 }).withMessage('Max stock must be a positive integer'),
  body('current_stock').optional().isInt({ min: 0 }).withMessage('Current stock must be a positive integer'),
  body('cost_price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
];

const updatePartValidation = [
  body('part_name').optional().notEmpty().withMessage('Part name cannot be empty'),
  body('unit').optional().isIn(['piece', 'box', 'set', 'meter', 'liter', 'kg']).withMessage('Invalid unit type'),
  body('category_id').optional({ nullable: true }).isInt().withMessage('Category must be an integer'),
  body('supplier_id').optional({ nullable: true }).isInt().withMessage('Supplier must be an integer'),
  body('location_id').optional({ nullable: true }).isInt().withMessage('Location must be an integer'),
  body('min_stock').optional().isInt({ min: 0 }).withMessage('Min stock must be a positive integer'),
  body('max_stock').optional().isInt({ min: 0 }).withMessage('Max stock must be a positive integer'),
  body('cost_price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
];

const stockAdjustValidation = [
  body('adjustment_type').isIn(['add', 'remove']).withMessage('Adjustment type must be "add" or "remove"'),
  body('qty').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const reservePartValidation = [
  body('part_id').isInt({ min: 1 }).withMessage('Part ID is required'),
  body('qty_reserved').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('repair_request_id').optional({ nullable: true }).isInt().withMessage('Repair request ID must be an integer'),
];

const consumePartValidation = [
  body('part_id').isInt({ min: 1 }).withMessage('Part ID is required'),
  body('qty_used').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('repair_request_id').optional({ nullable: true }).isInt().withMessage('Repair request ID must be an integer'),
];

module.exports = {
  createPartValidation,
  updatePartValidation,
  stockAdjustValidation,
  reservePartValidation,
  consumePartValidation,
};